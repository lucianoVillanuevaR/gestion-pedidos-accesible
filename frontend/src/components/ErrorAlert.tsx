import AlertMessage from "./ui/AlertMessage";

type ErrorAlertProps = {
  isHighContrast?: boolean;
  isLarge?: boolean;
  message: string;
};

function ErrorAlert({ isHighContrast = false, isLarge = false, message }: ErrorAlertProps) {
  return <AlertMessage isHighContrast={isHighContrast} isLarge={isLarge} message={message} tone="error" />;
}

export default ErrorAlert;
