"use server"

import { connectToDatabase } from "../mongoose"

export async function createQuestion(parms: any) {
    try {
        connectToDatabase()
    } catch (error) {
        console.log('Error in createQuestion', error)
    }
}