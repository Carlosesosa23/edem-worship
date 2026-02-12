import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4">
                    <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl max-w-lg w-full">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Algo salió mal 😔</h1>
                        <p className="mb-4 text-neutral-300">
                            La aplicación ha encontrado un error inesperado.
                        </p>
                        <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-48 text-xs font-mono text-red-200 mb-6">
                            {this.state.error?.toString()}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Recargar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
