/**
 * Email Service - Business Logic Layer
 * Handles email generation using OpenAI GPT-4o-mini
 */

import { Result, ok, err } from '../../../lib/result';
import { AppError, createError } from '../../../lib/errors';
import { OpenAI } from 'openai';
import { GenerateEmailInput, GeneratedEmail, OpenAIConfig } from './email.types';

export class EmailService {
  private openai: OpenAI | null = null;
  private config: OpenAIConfig;

  constructor() {
    // Initialize configuration from environment variables
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.7,
    };

    // Initialize OpenAI client if API key is provided
    if (this.config.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
      });
    }
  }

  /**
   * Generate email notification for dispatched order
   */
  async generateEmail(input: GenerateEmailInput): Promise<Result<GeneratedEmail, AppError>> {
    // Validate OpenAI configuration
    if (!this.openai) {
      return err(createError.internalError('OpenAI API key not configured'));
    }

    try {
      const prompt = this.createEmailPrompt(input.orderNumber, input.customerName);
      
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente especializado en generar emails de notificación profesionales para una empresa de equipos de tenis. Debes generar emails en español con un tono profesional pero amigable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const generatedContent = completion.choices[0]?.message?.content;
      
      if (!generatedContent) {
        return err(createError.openaiError('No content generated from OpenAI'));
      }
      const generatedEmail: GeneratedEmail = {
        content: generatedContent,
        orderNumber: input.orderNumber,
        customerName: input.customerName,
        generatedAt: new Date(),
      };

      // Server-side logging for Vercel deployment
      console.log('🚀 [EMAIL SERVICE] Email generated successfully');
      console.log('📧 [EMAIL SERVICE] Content preview:', generatedContent);
      console.log('📋 [EMAIL SERVICE] Order Number:', input.orderNumber);
      console.log('👤 [EMAIL SERVICE] Customer Name:', input.customerName);
      console.log('🕐 [EMAIL SERVICE] Generated At:', generatedEmail.generatedAt.toISOString());

      return ok(generatedEmail);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Server-side error logging for Vercel deployment
      console.error('❌ [EMAIL SERVICE] Error generating email:', errorMessage);
      console.error('📋 [EMAIL SERVICE] Order Number:', input.orderNumber);
      console.error('👤 [EMAIL SERVICE] Customer Name:', input.customerName);
      
      return err(createError.openaiError(`Failed to generate email: ${errorMessage}`));
    }
  }

  /**
   * Create the prompt for email generation
   */
  private createEmailPrompt(orderNumber: string, customerName: string): string {
    return `
Genera un email de notificación profesional en español para informar a un cliente que su pedido ha sido despachado.

Información del pedido:
- Número de Orden: ${orderNumber}
- Nombre del Cliente: ${customerName}
- Estado: DESPACHADO

El email debe incluir:
1. Saludo personalizado con el nombre del cliente
2. Información clara sobre el despacho del pedido
3. Número de orden para referencia
4. Mensaje de agradecimiento
5. Información de contacto (usar datos genéricos de TenisPro)
6. Despedida profesional

CONTENIDO:
[contenido completo del email]

Mantén un tono profesional pero amigable, y asegúrate de que toda la información esté en español.
    `;
  }
}
