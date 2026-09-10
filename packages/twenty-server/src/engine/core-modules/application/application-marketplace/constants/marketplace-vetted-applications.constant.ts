export const MARKETPLACE_VETTED_APPLICATIONS: {
  universalIdentifier: string;
  position?: number;
}[] = [
  {
    universalIdentifier: '8da4b8b5-5edf-4880-b51f-ab6e679ec617', // Call Recorder
    position: 1,
  },
  {
    universalIdentifier: '4a1178c1-3535-4a47-b592-231d3216b36f', // Linear
    position: 2,
  },
  {
    universalIdentifier: '66a504cc-0a75-410e-a43f-cdeae1db1522', // Last contact
    position: 3,
  },
  {
    universalIdentifier: '2b7f4a2e-9c4b-4a11-b63c-2e5e7d3f5a9a', // Exa
    position: 4,
  },
  {
    universalIdentifier: 'a8c47f21-3b9e-4d2a-8f61-9c0e7d4a2b51', // Slack
    position: 5,
  },
  // Fork additions keep upstream ordering untouched and append after it, so a
  // future upstream insert cannot silently re-associate an identifier.
  {
    universalIdentifier: 'e003bed6-c04d-41b7-b09e-22bdd3397888', // Zalo OA
    position: 6,
  },
  {
    universalIdentifier: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', // Commerce
    position: 7,
  },
];
