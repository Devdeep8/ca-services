import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/getcurrentUser";
import { validationBodyData } from "@/utils/getDataValidated";
import {
  CreateCalendarEventInput,
  CreateCalendarEventSchema,
  createCalendarEvent,
} from "@/services/calander-services/create-calander-items.service";
import { db } from "@/lib/db";
import { getActiveWorkspaceId } from "@/utils/workspace-helper";
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const getUserWorkSpaceId = await getActiveWorkspaceId(user.email);
    if (!getUserWorkSpaceId) {
      throw new Error("No workspace found");
    }
    const validatedData = await validationBodyData(req, CreateCalendarEventSchema);


    if(!validatedData.success){
      throw new Error('Invalid data')
    }

    const getWorkSpaceCalenderId = await db.workspace.findUnique({
      where: {
        id: getUserWorkSpaceId,
      },
      select: {
        id: true,
      },
    });

    if(!getWorkSpaceCalenderId){
      throw new Error('No calander found')
    }


    const calanderEventCreated = await createCalendarEvent( validatedData.data , user.id , getWorkSpaceCalenderId?.id );

    return NextResponse.json({ message: 'Calander event created successfully' , data: calanderEventCreated }, { status: 201 });

  } catch (error) {
    console.error("calander error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
