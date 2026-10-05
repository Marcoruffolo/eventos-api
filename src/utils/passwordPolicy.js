const PASSWORD_RULES = [
    { test: (password) => password.length >= 8, message: "al menos 8 caracteres" },
    { test: (password) => /[A-Z]/.test(password), message: "una mayúscula" },
    { test: (password) => /[a-z]/.test(password), message: "una minúscula" },
    { test: (password) => /[0-9]/.test(password), message: "un número" },
]

export const getPasswordErrors = (password = "") => {
    return PASSWORD_RULES
        .filter((rule) => !rule.test(password))
        .map((rule) => rule.message)
}
