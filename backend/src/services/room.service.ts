import { RoomModel } from '../models/room.model.js';
import { Room } from '../types/index.js';

export class RoomService {
  static async getAllRooms() {
    return RoomModel.findAll();
  }

  static async getRoomById(id: number) {
    if (id < 1 || id > 4) {
      throw { status: 400, message: 'La sala solicitada debe estar entre la 1 y la 4' };
    }
    const room = await RoomModel.findById(id);
    if (!room) {
      throw { status: 404, message: 'Sala no encontrada' };
    }
    return room;
  }

  static async updateRoom(id: number, data: Partial<Omit<Room, 'id'>>) {
    if (id < 1 || id > 4) {
      throw { status: 400, message: 'Identificador de sala inválido (1 a 4)' };
    }
    return RoomModel.update(id, data);
  }
}

