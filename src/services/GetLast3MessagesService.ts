import prismaClient from "../prisma";

class GetLast3MessagesService {
  async execute() {
    const massages = await prismaClient.message.findMany({
      take: 3,
      orderBy: {
        created_at: "desc",
      },
      include: {
        user: true,
      },
    });

    return massages;
  }
}

export { GetLast3MessagesService };
