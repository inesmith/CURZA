export function humanAuthError(code?: string) {
  switch (code) {
    case "auth/user-not-found":
      return "Your account has not been registered. Please sign up.";
    case "auth/wrong-password":
      return "Incorrect email or password. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger one.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Please enter the valid details and try again.";
  }
}
