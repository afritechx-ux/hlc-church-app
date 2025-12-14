import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    private connectedUsers = new Map<string, string>(); // socketId -> userId

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
            if (token) {
                const payload = this.jwtService.verify(token, {
                    secret: this.configService.get<string>('JWT_SECRET'),
                });
                this.connectedUsers.set(client.id, payload.sub);
                client.join(`user:${payload.sub}`);
                this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
            } else {
                this.logger.warn(`Client connected without auth: ${client.id}`);
            }
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = this.connectedUsers.get(client.id);
        this.connectedUsers.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
    }

    @SubscribeMessage('ping')
    handlePing(client: Socket) {
        return { event: 'pong', data: { timestamp: new Date().toISOString() } };
    }

    // Broadcast to all connected clients
    broadcastToAll(event: string, data: any) {
        this.server.emit(event, data);
    }

    // Send to specific user
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    // Broadcast check-in notification
    notifyCheckIn(data: { memberId: string; memberName: string; serviceName: string }) {
        this.broadcastToAll('new-checkin', {
            type: 'checkin',
            message: `${data.memberName} checked in to ${data.serviceName}`,
            timestamp: new Date().toISOString(),
            ...data,
        });
    }

    // Broadcast new donation notification
    notifyDonation(data: { amount: number; fundName: string; anonymous?: boolean }) {
        this.broadcastToAll('new-donation', {
            type: 'donation',
            message: data.anonymous
                ? `Anonymous donation of GHS ${data.amount} to ${data.fundName}`
                : `New donation of GHS ${data.amount} to ${data.fundName}`,
            timestamp: new Date().toISOString(),
            ...data,
        });
    }

    // Notify follow-up assignment
    notifyFollowUpAssigned(userId: string, data: { taskId: string; memberName: string; followUpType: string }) {
        this.sendToUser(userId, 'follow-up-assigned', {
            notificationType: 'followup',
            message: `New follow-up assigned: ${data.memberName} (${data.followUpType})`,
            timestamp: new Date().toISOString(),
            ...data,
        });
    }

    // Broadcast service starting soon
    notifyServiceStarting(data: { serviceName: string; startsIn: string }) {
        this.broadcastToAll('service-starting', {
            type: 'service',
            message: `${data.serviceName} starts in ${data.startsIn}`,
            timestamp: new Date().toISOString(),
            ...data,
        });
    }
}
