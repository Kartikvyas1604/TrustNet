import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { verifyToken } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AuthenticatedSocket extends Socket {
  userId?: string
  userType?: 'organization' | 'employee' | 'admin'
  organizationId?: string
}

export class WebSocketService {
  private io: SocketIOServer
  private userSockets: Map<string, Set<string>> = new Map()

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    })

    this.initialize()
  }

  private initialize() {
    this.io.use(this.authenticateSocket.bind(this))
    this.io.on('connection', this.handleConnection.bind(this))
    console.log('✅ WebSocket service initialized')
  }

  // Authenticate socket connections
  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token

      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const decoded = verifyToken(token as string)
      if (!decoded) {
        return next(new Error('Invalid authentication token'))
      }

      socket.userId = decoded.id
      socket.userType = decoded.type
      socket.organizationId = decoded.organizationId

      next()
    } catch (error: any) {
      next(new Error('Authentication failed'))
    }
  }

  // Handle new socket connections
  private handleConnection(socket: AuthenticatedSocket) {
    console.log(`🔌 Client connected: ${socket.userId} (${socket.userType})`)

    // Track socket for this user
    if (socket.userId) {
      if (!this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, new Set())
      }
      this.userSockets.get(socket.userId)!.add(socket.id)

      // Join rooms based on user type
      if (socket.userType === 'organization') {
        socket.join(`org:${socket.userId}`)
      } else if (socket.userType === 'employee' && socket.organizationId) {
        socket.join(`org:${socket.organizationId}`)
        socket.join(`employee:${socket.userId}`)
      } else if (socket.userType === 'admin') {
        socket.join('admin')
      }
    }

    // Handle events
    socket.on('subscribe:transactions', () => this.handleTransactionSubscription(socket))
    socket.on('subscribe:approvals', () => this.handleApprovalsSubscription(socket))
    socket.on('subscribe:balance', () => this.handleBalanceSubscription(socket))
    socket.on('ping', () => socket.emit('pong'))

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.userId}`)
      if (socket.userId) {
        const sockets = this.userSockets.get(socket.userId)
        if (sockets) {
          sockets.delete(socket.id)
          if (sockets.size === 0) {
            this.userSockets.delete(socket.userId)
          }
        }
      }
    })
  }

  // Subscribe to transaction updates
  private handleTransactionSubscription(socket: AuthenticatedSocket) {
    if (socket.userType === 'employee') {
      socket.join(`transactions:${socket.userId}`)
      console.log(`📊 ${socket.userId} subscribed to transaction updates`)
    }
  }

  // Subscribe to approval updates
  private handleApprovalsSubscription(socket: AuthenticatedSocket) {
    if (socket.userType === 'admin' || socket.userType === 'organization') {
      socket.join('approvals')
      console.log(`✅ ${socket.userId} subscribed to approval updates`)
    }
  }

  // Subscribe to balance updates
  private handleBalanceSubscription(socket: AuthenticatedSocket) {
    socket.join(`balance:${socket.userId}`)
    console.log(`💰 ${socket.userId} subscribed to balance updates`)
  }

  // Emit transaction update
  public emitTransactionUpdate(userId: string, transaction: any) {
    this.io.to(`transactions:${userId}`).emit('transaction:update', transaction)
    this.io.to(`employee:${userId}`).emit('transaction:update', transaction)
  }

  // Emit transaction confirmation
  public emitTransactionConfirmed(userId: string, transaction: any) {
    this.io.to(`transactions:${userId}`).emit('transaction:confirmed', transaction)
    this.io.to(`employee:${userId}`).emit('transaction:confirmed', transaction)
  }

  // Emit balance update
  public emitBalanceUpdate(userId: string, balance: any) {
    this.io.to(`balance:${userId}`).emit('balance:update', balance)
  }

  // Emit approval request (for admins/organizations)
  public emitApprovalRequest(organizationId: string, approval: any) {
    this.io.to('admin').emit('approval:new', approval)
    this.io.to(`org:${organizationId}`).emit('approval:new', approval)
  }

  // Emit approval decision
  public emitApprovalDecision(userId: string, decision: any) {
    this.io.to(`employee:${userId}`).emit('approval:decision', decision)
    this.io.to(`transactions:${userId}`).emit('approval:decision', decision)
  }

  // Emit organization status update
  public emitOrganizationStatusUpdate(organizationId: string, status: any) {
    this.io.to(`org:${organizationId}`).emit('organization:status', status)
  }

  // Emit payroll execution update
  public emitPayrollUpdate(organizationId: string, payroll: any) {
    this.io.to(`org:${organizationId}`).emit('payroll:update', payroll)
  }

  // Emit to specific user
  public emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId)
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data)
      })
    }
  }

  // Broadcast to all admins
  public emitToAdmins(event: string, data: any) {
    this.io.to('admin').emit(event, data)
  }

  // Broadcast to organization
  public emitToOrganization(organizationId: string, event: string, data: any) {
    this.io.to(`org:${organizationId}`).emit(event, data)
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.userSockets.size
  }

  // Check if user is connected
  public isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId)
  }

  // Get socket.io instance
  public getIO(): SocketIOServer {
    return this.io
  }
}

let websocketService: WebSocketService | null = null

export function initializeWebSocket(server: HTTPServer): WebSocketService {
  if (!websocketService) {
    websocketService = new WebSocketService(server)
  }
  return websocketService
}

export function getWebSocketService(): WebSocketService {
  if (!websocketService) {
    throw new Error('WebSocket service not initialized')
  }
  return websocketService
}
