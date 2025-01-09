export function isValidSemester(semester: any) {
    return parseInt(semester) === 1 || parseInt(semester) === 2 || parseInt(semester) === 3;
}

export function isValidAnnualYear(year: any) {
    return /^AY\d{2}\/\d{2}$/.test(year);
}

export function isMonday(date: any) {
    return date && date.getDay() === 1; // 1 = Monday in JavaScript Date
}

export function convertTime(timeStr: any) {
    // Convert the time string to an integer
    var timeInt = parseInt(timeStr, 10);

    // Check if the time is within the range 0830 to 1200
    if (timeInt >= 830 && timeInt <= 2400) {
        // No conversion needed, it's already in the correct format
        return timeStr.toString().padStart(4, "0");
    } else {
        // Convert time in the range 0000 to 0730 to 1200 to 2130
        if (timeInt >= 0 && timeInt <= 730) {
            timeInt += 1200;
        }

        // Convert the integer back to a string with leading zeros
        return timeInt.toString().padStart(4, "0");
    }
}

export function areFilesUploaded(files: any) {
    // Check if all files have been uploaded
    return files != null;
}

export const propagateMergedCells = (row: any, mergeCells: any, rowIndex: any) => {
    mergeCells.forEach((merge: any) => {
        if (merge.s.r === rowIndex && merge.e.r === rowIndex) {
            for (let colIndex = merge.s.c; colIndex <= merge.e.c; colIndex++) {
                row[colIndex] = row[merge.s.c];
            }
        }
    });
    return row;
};

export const propagateMergedCellsVertically = (rows: any[], mergeCells: any[]) => {
    const dayHeaders: any[] = [];
    rows.forEach((row, rowIndex) => {
        mergeCells.forEach((merge) => {
            if (merge.s.c === 0 && merge.s.r <= rowIndex && merge.e.r >= rowIndex) {
                dayHeaders[rowIndex] = rows[merge.s.r][0];
            }
        });
        if (!dayHeaders[rowIndex]) {
            dayHeaders[rowIndex] = row[0];
        }
    });
    return dayHeaders;
};

export function getShortDayName(day: string) {
    switch (day) {
        case "Monday":
            return "Mon";
        case "Tuesday":
            return "Tue";
        case "Wednesday":
            return "Wed";
        case "Thursday":
            return "Thu";
        case "Friday":
            return "Fri";
        case "Saturday":
            return "Sat";
        case "Sunday":
            return "Sun";
        default:
            return null;
    }
}

export function extractRoomNumber(roomString: string) {
    // Use a regular expression to match the number part of the string
    const match = roomString.match(/\d+/);
    // If a match is found, return the number, otherwise return null
    return match ? match[0] : null;
}

export function createKey(arr: any) {
    return arr.join("|");
}

export function formatLocalDateTime(dateTime: Date) {
    const hours = String(dateTime.getHours()).padStart(2, "0");
    const minutes = String(dateTime.getMinutes()).padStart(2, "0");
    const seconds = String(dateTime.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

export function addTimeBy1HourMinus10Minutes(timeStr: any) {
    // Parse the input time string
    let hours = parseInt(timeStr.substring(0, 2));
    let minutes = parseInt(timeStr.substring(2, 4));

    // Create a Date object with the parsed time
    let date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    // Add one hour and subtract ten minutes
    date.setHours(date.getHours() + 1);
    date.setMinutes(date.getMinutes() - 10);

    // Format the adjusted time back into a string
    let adjustedHours = date.getHours().toString().padStart(2, "0");
    let adjustedMinutes = date.getMinutes().toString().padStart(2, "0");

    return adjustedHours + adjustedMinutes;
}