import React, { type ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SPACING, RADIUS } from "../theme/spacing";

interface IErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  declare props: IErrorBoundaryProps;
  declare setState: (state: Partial<IErrorBoundaryState>) => void;
  state: IErrorBoundaryState = { hasError: false, error: null };

  constructor(props: IErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// --- Standalone Error Fallback (also used for network errors) ---

interface IErrorFallbackProps {
  error?: Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorFallback({
  error,
  title = "Something went wrong",
  message,
  onRetry,
}: IErrorFallbackProps) {
  const displayMessage =
    message ?? error?.message ?? "An unexpected error occurred. Please try again.";

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>!</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{displayMessage}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING["2xl"],
    backgroundColor: "#080C14",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239,68,68,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  iconText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#EF4444",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F0F4FF",
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#8892AA",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: "#3B6FE8",
    paddingHorizontal: SPACING["2xl"],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
