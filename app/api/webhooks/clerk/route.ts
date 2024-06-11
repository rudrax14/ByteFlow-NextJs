/* eslint-disable camelcase */
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createUser, deleteUser, updateUser } from '@/lib/actions/user.action'

export async function POST(req: Request) {

    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    const payload = await req.json()
    const body = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    const eventType = evt.type;
    console.log(`Received webhook of type ${eventType}`);
    console.log(`Event data: ${JSON.stringify(evt.data)}`);


    if (evt.type === 'user.created') {
        const { id, email_addresses, image_url, username, first_name, last_name } = evt.data;

        const mongoUser = await createUser({
            clerkId: id,
            name: `${first_name}${last_name ? ` ${last_name}` : ''}`,
            username: username!,
            email: email_addresses[0].email_address,
            picture: image_url,
        })

        console.log(`User created: ${JSON.stringify(mongoUser)}`);
        return NextResponse.json({ message: 'OK', user: mongoUser })
    }

    if (evt.type === 'user.updated') {
        const { id, email_addresses, image_url, username, first_name, last_name } = evt.data;

        const mongoUser = await updateUser({
            clerkId: id,
            updateData: {
                name: `${first_name}${last_name ? ` ${last_name}` : ''}`,
                username: username!,
                email: email_addresses[0].email_address,
                picture: image_url,
            },
            path: `/profile/${id}`
        })

        console.log(`User updated: ${JSON.stringify(mongoUser)}`);
        return NextResponse.json({ message: 'OK', user: mongoUser })
    }

    if (evt.type === 'user.deleted') {
        const { id } = evt.data;

        const deletedUser = await deleteUser({
            clerkId: id!,
        })

        console.log(`User deleted: ${JSON.stringify(deletedUser)}`);
        return NextResponse.json({ message: 'OK', user: deletedUser })
    }

    console.warn(`Unhandled event type: ${eventType}`);
    return new Response('', { status: 201 })


}
