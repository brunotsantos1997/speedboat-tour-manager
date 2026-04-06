// src/core/common/AppError.ts
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM'
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly context?: Record<string, unknown>;
  public readonly userMessage: string;
  public readonly originalError?: Error;

  constructor(
    type: ErrorType,
    userMessage: string,
    message?: string,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message || userMessage);
    this.type = type;
    this.userMessage = userMessage;
    this.context = context;
    this.originalError = originalError;
  }

  static validation(message: string, context?: Record<string, unknown>): AppError {
    return new AppError(ErrorType.VALIDATION, message, message, context);
  }

  static network(message: string, originalError?: Error, context?: Record<string, unknown>): AppError {
    return new AppError(ErrorType.NETWORK, 'Falha de conexão. Verifique sua internet.', message, context, originalError);
  }

  static permission(message: string = 'Você não tem permissão para realizar esta ação.'): AppError {
    return new AppError(ErrorType.PERMISSION, message);
  }

  static business(message: string, context?: Record<string, unknown>): AppError {
    return new AppError(ErrorType.BUSINESS, message, message, context);
  }

  static system(message: string, originalError?: Error, context?: Record<string, unknown>): AppError {
    return new AppError(ErrorType.SYSTEM, 'Erro interno do sistema. Tente novamente.', message, context, originalError);
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      stack: this.stack
    };
  }
}
