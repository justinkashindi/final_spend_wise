"use strict";

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD"
});

const expenses = [
	{ id: 1, name: "Market Street Grocer", category: "Food", amountCents: 6428, date: "Today, 10:42 AM" },
	{ id: 2, name: "Cityline Transit", category: "Transport", amountCents: 1250, date: "Today, 8:15 AM" },
	{ id: 3, name: "Northstar Properties", category: "Rent", amountCents: 120000, date: "Sep 20, 2024" }
];

let monthlyBudgetCents = 350000;
let nextExpenseId = 4;

const remainingBalanceElement = document.querySelector("#remainingBalance");
const totalExpensesElement = document.querySelector("#totalExpenses");
const monthlyBudgetElement = document.querySelector("#monthlyBudget");
const budgetRemainingElement = document.querySelector("#budgetRemaining");
const budgetUsageElement = document.querySelector("#budgetUsage");
const budgetProgressElement = document.querySelector("#budgetProgress");
const budgetFeedbackElement = document.querySelector("#budgetFeedback");
const budgetForm = document.querySelector("#budgetForm");
const budgetInput = document.querySelector("#budgetInput");
const expenseForm = document.querySelector("#expenseForm");
const expenseList = document.querySelector("#expenseList");
const categoryGrid = document.querySelector("#categoryGrid");
const formMessage = document.querySelector("#formMessage");

function formatCents(amountCents) {
	return currencyFormatter.format(amountCents / 100);
}

function calculateTotalExpenses() {
	let total = 0;
	for (const expense of expenses) {
		total += expense.amountCents;
	}
	return total;
}

function createTextElement(tagName, className, text) {
	const element = document.createElement(tagName);
	element.className = className;
	element.textContent = text;
	return element;
}

function renderExpenses() {
	expenseList.replaceChildren();

	if (expenses.length === 0) {
		expenseList.append(createTextElement("p", "empty-state", "No expenses yet. Add one above to get started."));
		return;
	}

	for (let index = expenses.length - 1; index >= 0; index -= 1) {
		const expense = expenses[index];
		const row = document.createElement("div");
		row.className = "activity-row";

		const icon = createTextElement("span", "merchant-icon expense-icon", expense.category.slice(0, 1));
		icon.setAttribute("aria-hidden", "true");

		const copy = document.createElement("span");
		copy.className = "activity-copy";
		copy.append(
			createTextElement("strong", "", expense.name),
			createTextElement("small", "", `${expense.date} · ${expense.category}`)
		);

		row.append(icon, copy, createTextElement("span", "activity-amount", `−${formatCents(expense.amountCents)}`));

		const removeButton = createTextElement("button", "remove-expense", "Remove");
		removeButton.type = "button";
		removeButton.dataset.expenseId = String(expense.id);
		removeButton.setAttribute("aria-label", `Remove ${expense.name}`);
		row.append(removeButton);
		expenseList.append(row);
	}
}

function renderCategories() {
	categoryGrid.replaceChildren();

	if (expenses.length === 0) {
		categoryGrid.append(createTextElement("p", "empty-state", "Your category breakdown will appear here."));
		return;
	}

	const totalsByCategory = new Map();
	for (const expense of expenses) {
		const categoryTotal = totalsByCategory.get(expense.category) || 0;
		totalsByCategory.set(expense.category, categoryTotal + expense.amountCents);
	}

	for (const [category, amountCents] of totalsByCategory) {
		const card = document.createElement("article");
		card.className = "category-card";

		const top = document.createElement("div");
		top.className = "category-top";
		top.append(createTextElement("span", `category-icon category-${category.toLowerCase()}`, category.slice(0, 1)));

		const amountLabel = createTextElement("div", "category-amount", formatCents(amountCents));
		const nameLabel = createTextElement("div", "category-name", category);
		const percent = monthlyBudgetCents === 0
			? (amountCents > 0 ? 100 : 0)
			: (amountCents > 0 ? Math.max(1, Math.round((amountCents / monthlyBudgetCents) * 100)) : 0);
		const meta = document.createElement("div");
		meta.className = "category-meta";
		meta.append(
			createTextElement("span", "", `${percent}% of budget`),
			createTextElement("span", "", `${formatCents(amountCents)} spent`)
		);

		const meter = document.createElement("div");
		meter.className = "category-meter";
		meter.setAttribute("aria-label", `${category}: ${percent}% of monthly budget`);
		const meterFill = document.createElement("span");
		meterFill.style.setProperty("--fill", `${Math.min(percent, 100)}%`);
		meter.append(meterFill);

		card.append(top, nameLabel, amountLabel, meta, meter);
		categoryGrid.append(card);
	}
}

function renderDashboard() {
	const totalExpensesCents = calculateTotalExpenses();
	const remainingBalanceCents = monthlyBudgetCents - totalExpensesCents;
	const usagePercent = monthlyBudgetCents === 0
		? (totalExpensesCents > 0 ? 100 : 0)
		: Math.round((totalExpensesCents / monthlyBudgetCents) * 100);

	remainingBalanceElement.textContent = formatCents(remainingBalanceCents);
	totalExpensesElement.textContent = formatCents(totalExpensesCents);
	monthlyBudgetElement.textContent = formatCents(monthlyBudgetCents);
	budgetRemainingElement.textContent = `${formatCents(remainingBalanceCents)} left`;
	budgetUsageElement.textContent = `${usagePercent}% used`;
	budgetProgressElement.style.width = `${Math.min(usagePercent, 100)}%`;
	budgetProgressElement.parentElement.setAttribute("aria-label", `${usagePercent}% of monthly budget used`);

	if (remainingBalanceCents < 0) {
		budgetFeedbackElement.textContent = `Over budget by ${formatCents(Math.abs(remainingBalanceCents))}. Review your spending.`;
		budgetFeedbackElement.className = "budget-warning";
	} else if (remainingBalanceCents === 0) {
		budgetFeedbackElement.textContent = "You've reached your monthly budget.";
		budgetFeedbackElement.className = "budget-warning";
	} else if (usagePercent >= 80) {
		budgetFeedbackElement.textContent = "Heads up: you're close to your monthly budget.";
		budgetFeedbackElement.className = "budget-warning";
	} else {
		budgetFeedbackElement.textContent = "You're on track with your budget.";
		budgetFeedbackElement.className = "budget-positive";
	}

	renderExpenses();
	renderCategories();
}

budgetForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const newBudget = Number(budgetInput.value);
	const newBudgetCents = Math.round(newBudget * 100);
	if (!Number.isFinite(newBudget) || !Number.isSafeInteger(newBudgetCents) || newBudget < 0) {
		formMessage.textContent = "Enter a valid budget of zero or more.";
		return;
	}

	monthlyBudgetCents = newBudgetCents;
	formMessage.textContent = "Monthly budget updated.";
	renderDashboard();
});

expenseForm.addEventListener("submit", (event) => {
	event.preventDefault();

	const formData = new FormData(expenseForm);
	const name = String(formData.get("name")).trim();
	const category = String(formData.get("category"));
	const amount = Number(formData.get("amount"));
	const amountCents = Math.round(amount * 100);
	if (name === "" || !Number.isFinite(amount) || !Number.isSafeInteger(amountCents) || amountCents <= 0) {
		formMessage.textContent = "Enter an expense name and an amount greater than zero.";
		return;
	}

	expenses.push({
		id: nextExpenseId,
		name,
		category,
		amountCents,
		date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
	});
	nextExpenseId += 1;
	expenseForm.reset();
	formMessage.textContent = "Expense added to your dashboard.";
	renderDashboard();
});

expenseList.addEventListener("click", (event) => {
	const removeButton = event.target.closest("[data-expense-id]");
	if (!removeButton) return;

	const expenseId = Number(removeButton.dataset.expenseId);
	const expenseIndex = expenses.findIndex((expense) => expense.id === expenseId);
	if (expenseIndex === -1) return;

	expenses.splice(expenseIndex, 1);
	formMessage.textContent = "Expense removed.";
	renderDashboard();
});

renderDashboard();
