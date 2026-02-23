import os
import json
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Load environment variables
load_dotenv()

app = FastAPI()

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
client = None

if MONGO_URI:
    try:
        client = MongoClient(MONGO_URI)
        db = client.get_database()
        print("SUCCESS: Connected to MongoDB")
    except Exception as e:
        print(f"FAILED to connect to MongoDB: {e}")
else:
    print("WARNING: DATABASE_URL is not set. Database features will not work.")

# Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
chat_session = None

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

# Model configuration
models_to_try = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]
chat_session = None
GEMINI_READY = False

def initialize_gemini():
    global chat_session, GEMINI_READY
    if GEMINI_READY and chat_session:
        return True
        
    if not GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY is not set.")
        return False
        
    genai.configure(api_key=GEMINI_API_KEY)
    
    for model_name in models_to_try:
        try:
            print(f"Attempting to initialize Gemini with model: {model_name}")
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 64,
                    "max_output_tokens": 8192,
                },
                system_instruction=SYSTEM_PROMPT,
            )
            chat_session = model.start_chat(history=[])
            GEMINI_READY = True
            print(f"SUCCESS: Gemini API initialized with model: {model_name}")
            return True
        except Exception as e:
            print(f"FAILED to initialize model {model_name}: {str(e)}")
            
    return False

# Attempt initial fast configuration (no test message)
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
        
    if not db:
        return ChatResponse(
            response="The AI Banking Assistant is not connected to the database. Please check your DATABASE_URL environment variable."
        )
    
    if not GEMINI_READY or not chat_session:
        # Fallback to a helpful message instead of 503 error
        return ChatResponse(
            response="The AI Banking Assistant has temporarily exceeded its free tier usage quota (20 requests/day). Please try again tomorrow, or update the GEMINI_API_KEY in the .env file with a key from a new Google Cloud project."
        )

    try:
        # Send user message to Gemini
        response = chat_session.send_message(request.message)
        ai_content = response.text.strip()
        
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

            # If no results found, provide helpful debugging info
            if len(results) == 0:
                # Try a simpler query to see what data exists
                debug_query = [{"$limit": 5}, {"$project": {"type": 1, "description": 1, "amount": 1, "createdAt": 1}}]
                debug_results = list(collection.aggregate(debug_query))
                
                debug_info = f"\n\nDEBUG INFO: Here are some sample {collection_name} records to help understand the data:\n{json.dumps(debug_results, indent=2, default=str)}"
                
                return ChatResponse(
                    response=f"No results found for your query. The database returned 0 records.{debug_info if debug_results else ''}",
                    data={"query": pipeline, "sample_data": debug_results}
                )

            # Summarize the results
            summary_prompt = f"""
            User Question: "{request.message}"
            Database Results: {json.dumps(results[:10], default=str)} (showing first 10 items out of {len(results)} total)
            
            Provide a clear, natural language summary. Include:
            - Total number of records found
            - Key details from the data (amounts, dates, types)
            - Any important patterns or insights
            Be specific with numbers, dates, and amounts. Format currencies properly.
            """
            
            summary_response = chat_session.send_message(summary_prompt)
            summary = summary_response.text.strip()
            
            return ChatResponse(response=summary, data=results)

        except json.JSONDecodeError:
             return ChatResponse(response=f"AI Error: Failed to parse response. Raw: {ai_content}")

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        return ChatResponse(response=f"An error occurred: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "gemini_ready": GEMINI_READY,
        "mongodb_connected": client is not None,
        "available_collections": db.list_collection_names() if client else []
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