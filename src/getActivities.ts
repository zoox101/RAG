import { Activity } from "./types.ts";

export const getActivities = (): Activity[] => [
    {
        name: "snorkel",
        title: "Guided Snorkeling Adventure",
        description:
            "Join a guided snorkeling tour and explore vibrant coral reefs teeming with marine life. Gear, including a mask, fins, and snorkel, is provided for a hassle-free experience in the crystal-clear waters.",
        price: 30,
        duration: 120,
        startTime: "09:00 AM",
    },
    {
        name: "surfing",
        title: "Surfing Lessons for All Levels",
        description:
            "Catch some waves with professional surfing instructors. Enjoy a fun-filled session on the beach, where you'll learn the basics or improve your skills on a surfboard in the stunning ocean waves.",
        price: 50,
        duration: 180,
        startTime: "10:00 AM",
    },
    {
        name: "turtle",
        title: "Sea Turtle Encounter Experience",
        description:
            "Witness the beauty of sea turtles up close in their natural habitat. This peaceful beach walk offers a chance to observe these magnificent creatures as they bask in the sun and return to the ocean.",
        price: 0,
        duration: 60,
        startTime: "11:30 AM",
    },
    {
        name: "pirate",
        title: "Classic Sailing Ship Tour",
        description:
            "Set sail on a classic wooden ship and experience the thrill of the open sea. Enjoy breathtaking views, learn about maritime history, and soak in the adventurous atmosphere while cruising the coastline.",
        price: 100,
        duration: 240,
        startTime: "01:00 PM",
    },
    {
        name: "sailboat",
        title: "Sailing Experience on a Modern Yacht",
        description:
            "Enjoy a luxurious sailing experience on a sleek yacht. Feel the wind in your hair as you navigate the tranquil waters, taking in stunning coastal views and enjoying the serenity of the ocean.",
        price: 120,
        duration: 180,
        startTime: "03:00 PM",
    },
    {
        name: "sunset",
        title: "Scenic Sunset Viewing",
        description:
            "Relax and unwind as you watch the sun dip below the horizon, painting the sky with vibrant colors. This tranquil experience is perfect for capturing stunning photographs and enjoying the beauty of nature.",
        price: 0,
        duration: 60,
        startTime: "06:30 PM",
    },
];
