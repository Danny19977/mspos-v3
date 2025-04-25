

export function getBusinessDaysBetweenDates(startDate: Date, endDate: Date): number {
    let count = 0;
    const oneDay = 24 * 60 * 60 * 1000; // Nombre de millisecondes dans une journée
    const start = new Date(startDate.getTime());
    const end = new Date(endDate.getTime());

    while (start <= end) {
      if (start.getDay() !== 0 && start.getDay() !== 6) { // Si ce n'est pas un samedi ou un dimanche
        count++;
      }
      start.setDate(start.getDate() + 1);
    }

    return count;
  }