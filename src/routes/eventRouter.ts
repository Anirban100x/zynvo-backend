//tested
import { Request, Response, Router } from 'express';
import { logger } from '../utils/logger';
import prisma from '../db/db';
import { EventSchema } from '../types/formtypes';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();
const Verification = (req: Request, res: Response) => {
  if (!req.isVerified) {
    res.status(400).json({
      msg: 'please verify yourself first',
    });
  }
};

//router.use(Verification)

router.post('/event', AuthMiddleware, async (req: Request, res: Response) => {
  //include pfp later
  const { eventName, description } = req.body;
  const userId = req.id;
  const parsedData = EventSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.json({
      msg: 'incorrect format',
    });
  }
  try {
    const club = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        clubName: true,
        clubId: true,
      },
    });

    if (!club) {
      res.json({
        msg: 'invalid user or club',
      });
    }

    const response = await prisma.event.create({
      data: {
        EventName: parsedData.data?.eventName as string,
        description: parsedData.data?.description as string,
        clubName: club?.clubName as string,
        clubId: club?.clubId as string,
      },
    });

    if (response) {
      res.status(200).json({
        msg: 'event created',
        id: response.id,
      });
    } else {
      res.json('error crreating event');
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      msg: 'error creating event',
    });
  }
});

router.get(
  '/event/:id',
  AuthMiddleware,
  async (req: Request, res: Response) => {
    const Eventid = req.params.id;

    try {
      if (Eventid) {
        const response = await prisma.event.findFirst({
          where: {
            id: Eventid,
          },
          select: {
            id: true,
            EventName: true,
            clubName: true,
            description: true,
            // add pics later
          },
        });

        if (!response) {
          res.json({
            msg: 'no such event',
          });
        }

        res.status(200).json({
          msg: 'event found',
          response,
        });
      }
    } catch (error) {
      logger.error(error);
    }
  }
);

router.get(
  '/eventByClub/:id',
  AuthMiddleware,
  async (req: Request, res: Response) => {
    const clubId = req.params.id;

    try {
      const event = await prisma.event.findMany({
        where: {
          clubId: clubId,
        },
      });

      if (event) {
        res.status(200).json({
          msg: 'fetched',
          event, // [{}, {}, {}]
        });
        return;
      } else {
        res.status(404).json({
          msg: 'no club found',
        });
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }
);

router.get('/all', async (req: Request, res: Response) => {
  try {
    const response = await prisma.event.findMany({
      include: {
        attendees: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    if (!response) {
      res.status(404).json({
        msg: 'No events found',
      });
      return;
    }
    res.status(200).json({
      msg: 'found',
      response,
    });
  } catch (error) {
    res.status(500).json({
      msg: 'internal server error',
    });
  }
});

router.post(
  'registerEvent',
  AuthMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.id;
    if (!userId) {
      res.status(402).json({
        msg: 'invalid user',
      });
      return;
    }

    const { eventId } = req.body;
    try {
      const alreadyRegistered = await prisma.userEvents.findUnique({
        where: {
          userId_eventId: {
            userId: userId,
            eventId: eventId,
          },
        },
      });

      if (alreadyRegistered) {
        res.status(402).json({
          msg: 'already registered bro',
        });
        return;
      }

      const response = await prisma.userEvents.create({
        data: {
          userId: userId,
          eventId: eventId,
        },
      });

      if (response) {
        res.status(200).json({
          msg: 'registered successfully',
        });
        return;
      } else {
        res.status(402).json({
          msg: 'please try again later',
        });
      }
    } catch (error) {
      res.status(500).json({
        msg: 'internal server error',
      });

      console.log(error);
    }
  }
);

export const EventRouter = router;
