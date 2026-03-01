import os
import json
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from google import genai
from google.genai import types
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Load environment variables
load_dotenv()

# Use root_path for Vercel rewrites (/api/py -> /)
app = FastAPI(root_path="/api/py")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URI = os.getenv("DATABASE_URL") or os.getenv("MONGODB_URI")
db = None
client_db = None

if MONGO_URI:
    try:
        client_db = MongoClient(MONGO_URI)
        db = client_db.get_database()
        print("SUCCESS: Connected to MongoDB")
    except Exception as e:
        print(f"FAILED to connect to MongoDB: {e}")
else:
    print("WARNING: DATABASE_URL is not set. Database features will not work.")

# Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai_client = None
GEMINI_READY = False

# Enhanced SYSTEM_PROMPT with transaction type handling
SYSTEM_PROMPT = """
You are an intelligent assistant for a banking application admin. 
Your goal is to help the admin query the MongoDB database using natural language.

**CRITICAL: When querying by user name, you MUST use $lookup to join with profiles collection!**

You have access to the following collections and their COMPLETE schemas:

1. **profiles** (User Profile Information):
   {
     _id: ObjectId,
     userId: String,           // May be Clerk user ID (legacy field, may not exist)
     clerkId: String,          // Primary Clerk ID - USE THIS for joins
     email: String,            // User email
     fullName: String,         // Full name - USE FOR NAME SEARCHES
     phone: String,            // Phone number
     address: String,          // User address
     kycStatus: String,        // KYC status (pending, verified, rejected)
     isAdmin: Boolean,         // Admin flag
     createdAt: Date,
     updatedAt: Date
   }

2. **accounts** (Bank Accounts):
   {
     _id: ObjectId,
     userId: String,           // References profiles.clerkId (or profiles.userId for legacy)
     accountNumber: String,
     accountType: String,
     balance: Number,
     currency: String,
     status: String,
     createdAt: Date,
     updatedAt: Date
   }

3. **transactions** (Account Transactions):
   {
     _id: ObjectId,
     userId: String,           // References profiles.clerkId - DOES NOT STORE NAME!
     accountId: ObjectId,      // References accounts._id
     amount: Number,
     type: String,             // IMPORTANT: Can be "credit", "debit", "deposit", "withdrawal", "transfer"
                               // For deposits, check for type containing "deposit" OR amount > 0 with credit type
     status: String,           // completed, pending, failed
     description: String,      // May contain "deposit", "Stripe deposit", etc.
     referenceId: String,
     recipientAccountId: ObjectId,
     recipientUserId: String,
     createdAt: Date
   }

4. **loans** (Loan Applications):
   {
     _id: ObjectId,
     userId: String,           // References profiles.clerkId
     loanType: String,
     amount: Number,
     interestRate: Number,
     tenureMonths: Number,
     status: String,
     totalPayable: Number,
     amountPaid: Number,
     emiAmount: Number,
     remainingAmount: Number,
     disbursementAccountId: ObjectId,
     approvedBy: String,
     approvedAt: Date,
     disbursedAt: Date,
     nextEmiDate: Date,
     createdAt: Date,
     updatedAt: Date
   }

5. **emipayments** (EMI Payment Records):
   {
     _id: ObjectId,
     loanId: ObjectId,
     userId: String,           // References profiles.clerkId
     emiNumber: Number,
     amount: Number,
     principalAmount: Number,
     interestAmount: Number,
     status: String,
     dueDate: Date,
     paidDate: Date,
     stripePaymentId: String,
     transactionId: ObjectId,
     createdAt: Date
   }

**CRITICAL RULES:**

1. **For NAME-BASED queries**: Always use $lookup to join profiles collection
2. **For TRANSACTION TYPE queries**: 
   - Deposits can be identified by:
     * type field containing "deposit" (case-insensitive)
     * type field containing "credit" (case-insensitive)  
     * description field containing "deposit" (case-insensitive)
     * description field containing "stripe deposit" (case-insensitive)
   - ALWAYS use $or with multiple conditions to catch all variations
   - DO NOT require amount > 0 as a mandatory condition - some systems store all amounts as positive
   - Use $regex with $options: "i" for ALL text matching
   - Example: {"$or": [{"type": {"$regex": "deposit|credit", "$options": "i"}}, {"description": {"$regex": "deposit", "$options": "i"}}]}
3. **For DATE/TIME queries**:
   - Current date is January 9, 2026
   - "this month" means the CURRENT month (January 2026) = createdAt field is already a Date type
   - Use direct date comparison: {"createdAt": {"$gte": new Date("2026-01-01"), "$lt": new Date("2026-02-01")}}
   - IMPORTANT: createdAt is already a Date object, NOT a string - never use $dateFromString
   - For "last month" or "December" use appropriate date ranges (December 2025: 2025-12-01 to 2026-01-01)

**CORRECT Patterns for Common Queries:**

Q: "Total deposits this month"
A: {
  "collection": "transactions",
  "pipeline": [
    {
      "$match": {
        "$and": [
          {
            "$or": [
              {"type": {"$regex": "deposit|credit", "$options": "i"}},
              {"description": {"$regex": "deposit", "$options": "i"}}
            ]
          },
          {"createdAt": {"$gte": {"$date": "2026-01-01T00:00:00.000Z"}, "$lt": {"$date": "2026-02-01T00:00:00.000Z"}}}
        ]
      }
    },
    {"$sort": {"createdAt": -1}},
    {
      "$project": {
        "amount": 1,
        "type": 1,
        "description": 1,
        "createdAt": 1,
        "status": 1
      }
    }
  ]
}

Q: "Total deposits last month" or "Total deposits in December" or "deposits in december"
A: {
  "collection": "transactions",
  "pipeline": [
    {
      "$match": {
        "$and": [
          {
            "$or": [
              {"type": {"$regex": "deposit|credit", "$options": "i"}},
              {"description": {"$regex": "deposit", "$options": "i"}}
            ]
          },
          {"createdAt": {"$gte": {"$date": "2025-12-01T00:00:00.000Z"}, "$lt": {"$date": "2026-01-01T00:00:00.000Z"}}}
        ]
      }
    },
    {"$sort": {"createdAt": -1}},
    {
      "$project": {
        "amount": 1,
        "type": 1,
        "description": 1,
        "createdAt": 1,
        "status": 1
      }
    }
  ]
}

Q: "Total deposits" (all time)
A: {
  "collection": "transactions",
  "pipeline": [
    {
      "$match": {
        "$or": [
          {"type": {"$regex": "deposit|credit", "$options": "i"}},
          {"description": {"$regex": "deposit", "$options": "i"}}
        ]
      }
    },
    {"$sort": {"createdAt": -1}},
    {
      "$project": {
        "amount": 1,
        "type": 1,
        "description": 1,
        "createdAt": 1,
        "status": 1
      }
    }
  ]
}

Q: "Show me transaction history for Lavanya Kumar"
A: {
  "collection": "transactions",
  "pipeline": [
    {
      "$lookup": {
        "from": "profiles",
        "localField": "userId",
        "foreignField": "clerkId",
        "as": "userProfile"
      }
    },
    {"$unwind": "$userProfile"},
    {
      "$match": {
        "userProfile.fullName": {"$regex": "Lavanya Kumar", "$options": "i"}
      }
    },
    {"$sort": {"createdAt": -1}},
    {
      "$project": {
        "amount": 1,
        "type": 1,
        "status": 1,
        "description": 1,
        "createdAt": 1,
        "userProfile.fullName": 1
      }
    }
  ]
}

Q: "What was the last transaction by Lavanya Kumar?"
A: {
  "collection": "transactions",
  "pipeline": [
    {
      "$lookup": {
        "from": "profiles",
        "localField": "userId",
        "foreignField": "clerkId",
        "as": "userProfile"
      }
    },
    {"$unwind": "$userProfile"},
    {
      "$match": {
        "userProfile.fullName": {"$regex": "Lavanya Kumar", "$options": "i"}
      }
    },
    {"$sort": {"createdAt": -1}},
    {"$limit": 1},
    {
      "$project": {
        "amount": 1,
        "type": 1,
        "description": 1,
        "createdAt": 1,
        "status": 1
      }
    }
  ]
}

Q: "All withdrawals this month"
A: {
  "collection": "transactions",
  "pipeline": [
    {
      "$match": {
        "$and": [
          {
            "$or": [
              {"type": {"$regex": "withdrawal", "$options": "i"}},
              {"type": {"$regex": "debit", "$options": "i"}},
              {"description": {"$regex": "withdrawal", "$options": "i"}}
            ]
          },
          {"createdAt": {"$gte": {"$date": "2026-01-01T00:00:00.000Z"}, "$lt": {"$date": "2026-02-01T00:00:00.000Z"}}}
        ]
      }
    },
    {"$sort": {"createdAt": -1}}
  ]
}

Q: "In which month was the last withdrawal made"
A: {
  "collection": "transactions",
  "pipeline": [
    {
      "$match": {
        "$or": [
          {"type": {"$regex": "withdrawal", "$options": "i"}},
          {"type": {"$regex": "debit", "$options": "i"}},
          {"description": {"$regex": "withdrawal", "$options": "i"}}
        ]
      }
    },
    {"$sort": {"createdAt": -1}},
    {"$limit": 1},
    {
      "$project": {
        "amount": 1,
        "type": 1,
        "description": 1,
        "createdAt": 1,
        "month": {"$month": "$createdAt"},
        "year": {"$year": "$createdAt"}
      }
    }
  ]
}

Q: "Show me the total balance of all accounts"
A: {"collection": "accounts", "pipeline": [{"$group": {"_id": null, "totalBalance": {"$sum": "$balance"}}}]}

Q: "Get phone number for Lavanya Kumar"
A: {"collection": "profiles", "pipeline": [{"$match": {"fullName": {"$regex": "Lavanya Kumar", "$options": "i"}}}, {"$project": {"fullName": 1, "email": 1, "phone": 1, "address": 1}}]}

If the user's request is not about data query, return: 
{"type": "conversation", "message": "Your helpful response here"}
"""

# Model configuration - ordered by preference (most reliable/highest quota first)
models_to_try = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
]
GEMINI_READY = False

def initialize_gemini():
    global genai_client, GEMINI_READY
    if GEMINI_READY and genai_client:
        return True
        
    if not GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY is not set.")
        return False
        
    try:
        # Use default v1beta client which supports system_instruction
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
        GEMINI_READY = True
        print("SUCCESS: Gemini API Client initialized (v1beta)")
        return True
    except Exception as e:
        print(f"FAILED to initialize Gemini Client: {str(e)}")
        return False

# Attempt initial configuration
initialize_gemini()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    data: Any = None

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    print(f"Chat request received: {request.message}")
    
    # Lazy initialization check
    if not GEMINI_READY:
        initialize_gemini()
        
    if db is None:
        return ChatResponse(
            response="The AI Banking Assistant is not connected to the database. Please check your DATABASE_URL environment variable."
        )
    
    if not GEMINI_READY or not genai_client:
        return ChatResponse(
            response="The AI Banking Assistant is not correctly initialized. Please check your GEMINI_API_KEY."
        )

    try:
        # Try each model in order, falling back on quota errors
        ai_content = None
        selected_model = None
        last_error = None

        for model_name in models_to_try:
            try:
                print(f"Trying model: {model_name}")
                response = genai_client.models.generate_content(
                    model=model_name,
                    contents=request.message,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.7,
                    )
                )
                ai_content = response.text.strip()
                selected_model = model_name
                print(f"Success with model: {model_name}")
                break
            except Exception as model_err:
                err_str = str(model_err)
                print(f"Model {model_name} failed: {err_str}")
                last_error = model_err
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                    print(f"Quota exceeded for {model_name}, trying next model...")
                    continue
                if "404" in err_str or "NOT_FOUND" in err_str:
                    print(f"Model {model_name} not available, trying next model...")
                    continue
                if "400" in err_str or "INVALID_ARGUMENT" in err_str:
                    print(f"Model {model_name} gave invalid argument error, trying next model...")
                    continue
                # Other unexpected error: raise immediately
                raise model_err

        if ai_content is None:
            return ChatResponse(
                response="All Gemini models have exceeded their quota. Please try again later or check your API key quota at https://ai.dev/rate-limit."
            )

        # Clean up markdown code blocks
        if ai_content.startswith("```json"):
            ai_content = ai_content[7:]
        if ai_content.startswith("```"):
            ai_content = ai_content[3:]
        if ai_content.endswith("```"):
            ai_content = ai_content[:-3]
        
        ai_content = ai_content.strip()

        # Handle non-query responses
        try:
            parsed_content = json.loads(ai_content)
            if isinstance(parsed_content, dict) and parsed_content.get("type") == "conversation":
                 return ChatResponse(response=parsed_content["message"])
            
            collection_name = parsed_content.get("collection")
            pipeline = parsed_content.get("pipeline")
            
            if not collection_name or not pipeline:
                return ChatResponse(response="Sorry, I couldn't understand how to query the database for that.")

            # Log the query being executed
            print(f"Executing query on {collection_name}:")
            print(f"Pipeline: {json.dumps(pipeline, indent=2, default=str)}")

            # Execute query
            collection = db[collection_name]
            results = list(collection.aggregate(pipeline))
            
            # Convert ObjectId and Date to string
            for doc in results:
                for key, value in doc.items():
                    if hasattr(value, '__str__'):
                        doc[key] = str(value)

            # If no results found
            if len(results) == 0:
                return ChatResponse(
                    response=f"No results found for your query in the {collection_name} collection.",
                    data={"query": pipeline}
                )

            # Summarize the results using the same working model
            summary_prompt = f"""
            User Question: "{request.message}"
            Database Results: {json.dumps(results[:10], default=str)} (showing first 10 items out of {len(results)} total)
            
            Provide a clear, natural language summary. Include numbers and format currencies properly.
            """
            
            summary_response = genai_client.models.generate_content(
                model=selected_model,
                contents=summary_prompt,
                config=types.GenerateContentConfig(temperature=0.3)
            )
            summary = summary_response.text.strip()
            
            return ChatResponse(response=summary, data=results)

        except json.JSONDecodeError:
             return ChatResponse(response=f"AI Error: Failed to parse response. Raw: {ai_content}")

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(response=f"An error occurred: {str(e)}")


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "gemini_ready": GEMINI_READY,
        "mongodb_connected": client_db is not None,
        "available_collections": db.list_collection_names() if client_db is not None else []
    }

@app.get("/debug/transactions")
async def debug_transactions():
    """Debug endpoint to see what transaction types exist"""
    try:
        # Get distinct transaction types
        types = db.transactions.distinct("type")
        
        # Get sample transactions
        samples = list(db.transactions.find().limit(5))
        for doc in samples:
            doc["_id"] = str(doc["_id"])
            if "createdAt" in doc:
                doc["createdAt"] = str(doc["createdAt"])
        
        return {
            "distinct_types": types,
            "sample_transactions": samples,
            "total_count": db.transactions.count_documents({})
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/schemas")
async def get_schemas():
    """Endpoint to view all available schemas"""
    return {
        "profiles": {
            "fields": ["clerkId", "userId", "email", "fullName", "phone", "address", "kycStatus", "isAdmin", "createdAt", "updatedAt"],
            "description": "User profile information - JOIN KEY: clerkId"
        },
        "accounts": {
            "fields": ["userId", "accountNumber", "accountType", "balance", "currency", "status", "createdAt", "updatedAt"],
            "description": "Bank accounts - userId references profiles.clerkId"
        },
        "transactions": {
            "fields": ["userId", "accountId", "amount", "type", "status", "description", "referenceId", "createdAt"],
            "description": "Transactions - userId references profiles.clerkId (NO NAME FIELD!)"
        },
        "loans": {
            "fields": ["userId", "loanType", "amount", "interestRate", "tenureMonths", "status", "totalPayable", "amountPaid", "emiAmount", "createdAt"],
            "description": "Loans - userId references profiles.clerkId"
        },
        "emipayments": {
            "fields": ["loanId", "userId", "emiNumber", "amount", "status", "dueDate", "paidDate", "createdAt"],
            "description": "EMI payments - userId references profiles.clerkId"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)