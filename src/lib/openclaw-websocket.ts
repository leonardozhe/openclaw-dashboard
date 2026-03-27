// lib/openclaw-websocket.ts
import { useEffect, useRef } from 'react';

interface OpenClawWebSocketOptions {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class OpenClawWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private options: OpenClawWebSocketOptions;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(url: string, options: OpenClawWebSocketOptions = {}) {
    this.url = url;
    this.options = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      ...options
    };
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = (event) => {
      this.reconnectAttempts = 0; // Reset attempts on successful connection
      if (this.options.onOpen) {
        this.options.onOpen();
      }
    };

    this.ws.onmessage = (event) => {
      try {
        // Try to parse as JSON first
        const data = JSON.parse(event.data);
        if (this.options.onMessage) {
          this.options.onMessage(data);
        }
      } catch (e) {
        // If not JSON, pass as string
        if (this.options.onMessage) {
          this.options.onMessage(event.data);
        }
      }
    };

    this.ws.onerror = (error) => {
      console.error('OpenClaw WebSocket error:', error);
      if (this.options.onError) {
        this.options.onError(error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('OpenClaw WebSocket closed:', event.code, event.reason);

      if (this.options.onClose) {
        this.options.onClose(event);
      }

      // Attempt to reconnect if needed
      if (this.options.reconnect && this.reconnectAttempts < (this.options.maxReconnectAttempts || 10)) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);

        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, this.options.reconnectInterval);
      }
    };
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  send(data: string | object): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send(payload);
    return true;
  }

  get readyState(): number | null {
    return this.ws ? this.ws.readyState : null;
  }

  get isOpen(): boolean {
    return this.ws ? this.ws.readyState === WebSocket.OPEN : false;
  }
}

// Hook to use OpenClaw WebSocket in React components
export const useOpenClawWebSocket = (
  url: string,
  options: OpenClawWebSocketOptions
): [OpenClawWebSocket, (data: string | object) => boolean] => {
  const wsRef = useRef<OpenClawWebSocket | null>(null);

  useEffect(() => {
    wsRef.current = new OpenClawWebSocket(url, options);
    wsRef.current.connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [url]);

  const send = (data: string | object): boolean => {
    if (wsRef.current) {
      return wsRef.current.send(data);
    }
    return false;
  };

  return [wsRef.current!, send];
};