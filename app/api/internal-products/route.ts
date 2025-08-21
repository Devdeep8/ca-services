import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export  async function POST(req: NextRequest){
    try {
        const data = await req.json()

        const {name } = data 


        const newClient = await db.internalProduct.create({
            data: {
                name : name
            }
        })


        if (!newClient) {
            return NextResponse.json({message:"Database Error"},{status:500})
        }

        return NextResponse.json(newClient,{status:201})

    } catch (error) {
        console.log(error);
        return NextResponse.json({message:"Internal server error"},{status:500})
    }
}

export async function GET(req:NextRequest){
    try {
        const client = await db.internalProduct.findMany({
            select:{
                id:true,
                name:true
            }
        })

        return NextResponse.json(client , {status:200})
    }catch (error) {
        console.log(error);
        return NextResponse.json({message:"Internal server error"},{status:500})
    }
}