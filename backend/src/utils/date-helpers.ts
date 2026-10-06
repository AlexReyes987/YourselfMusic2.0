/**
 * Utilidades para fechas y validación de bloques de tiempo de reservaciones.
 */

export function isValidHourlyBlock(startTime: string, endTime: string): boolean {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  if (startMin !== 0 || endMin !== 0) {
    return false;
  }

  return endHour > startHour;
}

export function calculateHours(startTime: string, endTime: string): number {
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  return endHour - startHour;
}

