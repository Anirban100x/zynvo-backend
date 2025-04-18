import { Request, Response, Router } from "express";
import { logger } from "../utils/logger";
import prisma from "../db/db";
import {  EventSchema } from "../types/formtypes";
import { AuthMiddleware } from "../middleware/AuthMiddleware";


const router = Router();

router.post("/event",AuthMiddleware, async (req:Request, res:Response) => {
//include pfp later
const {eventName, description} = req.body
const userId = req.id;
const parsedData =  EventSchema.safeParse(req.body)

if(!parsedData.success){
    res.json({
        msg : "incorrect format"
    })
}
try {
    const club = await prisma.user.findFirst({
        where : {
            id : userId
        }, 
        select : {
            clubName : true, 
            clubId : true
        }
    })

    if(!club) {
        res.json({
            msg  : "invalid user or club"
        })
    }

    const response = await prisma.event.create({
        data : {
            EventName : parsedData.data?.eventName as string, 
            description : parsedData.data?.description as string,
            clubName : club?.clubName as string,
            clubId : club?.clubId as string
        }
    })

        if(response) {
            res.status(200).json({
                msg  : "event created", 
                if : response.id
            })

        } else {
            res.json("error crreating event")
        }

    } catch (error) {
        logger.error(error);
        res.status(500).json({
            msg: "error creating event"
        })
    }
})


router.get("/event/:id", AuthMiddleware, async (req:Request, res:Response) => {
  const Eventid = req.params.id

  try {
    if(Eventid) {
      const response = await prisma.event.findFirst({
        where : {
          id : Eventid
        } , 
        select : {
          id : true, 
          EventName : true, 
          clubName : true, 
          description : true,
          // add pics later
        }
      })

      if(!response) {
        res.json({
          msg : "no such event"
        })
      }

      res.status(200).json({
        msg : "event found", 
        response
      })


    }  
  } catch (error) {
    logger.error(error);
  }
})
export const EventRouter = router;