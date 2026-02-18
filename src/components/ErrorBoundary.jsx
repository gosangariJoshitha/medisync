import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full border-l-4 border-red-500">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong.
            </h1>
            <p className="text-gray-600 mb-6">
              The application encountered a runtime error. This is likely due to
              missing data or a connection issue.
            </p>

            <div className="bg-red-50 p-4 rounded-lg overflow-auto mb-6 max-h-96 border border-red-100">
              <p className="font-mono text-red-600 font-bold mb-2">
                {this.state.error && this.state.error.toString()}
              </p>
              <pre className="font-mono text-xs text-red-800 whitespace-pre-wrap">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </div>

            <button
              onClick={() => (window.location.href = "/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
