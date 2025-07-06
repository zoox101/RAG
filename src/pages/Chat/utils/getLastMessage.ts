import { Message } from "./useChat";

export default (messages: Message[], sender: "You" | "Friend"): Message | undefined => {

    // Find the most recent user message that hasn't been responded to yet
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].sender === sender) {
            lastUserIndex = i;
            break;
        }
    }

    const lastMessage = messages[lastUserIndex];

    return lastMessage;

}