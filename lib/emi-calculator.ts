export function calculateEMI(principal: number, annualRate: number, tenureMonths: number) {
  const monthlyRate = annualRate / 12 / 100

  if (monthlyRate === 0) {
    return principal / tenureMonths
  }

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1)

  return Math.round(emi * 100) / 100
}

export function generateEMISchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date = new Date(),
) {
  const monthlyRate = annualRate / 12 / 100
  const emi = calculateEMI(principal, annualRate, tenureMonths)
  const schedule = []

  let remainingPrincipal = principal
  const currentDate = new Date(startDate)

  for (let i = 1; i <= tenureMonths; i++) {
    const interestAmount = remainingPrincipal * monthlyRate
    const principalAmount = emi - interestAmount
    remainingPrincipal -= principalAmount

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1)

    schedule.push({
      emi_number: i,
      amount: Math.round(emi * 100) / 100,
      principal_amount: Math.round(principalAmount * 100) / 100,
      interest_amount: Math.round(interestAmount * 100) / 100,
      due_date: new Date(currentDate).toISOString().split("T")[0],
      remaining_balance: Math.max(0, Math.round(remainingPrincipal * 100) / 100),
    })
  }

  return schedule
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}
