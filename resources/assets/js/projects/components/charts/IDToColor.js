export function IDToColor(id) {
    let hash = 0;
    while (id > 0) {
      hash += id & 0xFF;
      hash += (hash << 10);
      hash ^= (hash >> 6);
      id = id >> 8;
    }
    hash += (hash << 3);
    hash ^= (hash >> 11);
    hash += (hash << 15);
    id=hash & 0xFFFFFFFF; // Ensure it fits in 32 bits


    // Use the hash to generate a unique hue
    const hue = id % 360;
    const saturation = 70 + (id % 31); // Ensure saturation is between 70 and 100
    const lightness = 70 + (id % 21);  // Ensure lightness is between 70 and 90

    return `hsl(${hue} ${saturation}% ${lightness}%)`;
}
