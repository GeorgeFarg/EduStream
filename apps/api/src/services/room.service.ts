type Participant = {
  name: string;
  socketId: string;
};

type Room = {
  participants: Record<string, Participant>;
  createdAt: number;
};

export const rooms: Record<string, Room> = {};