export const getDateRange = (range) => {
    const now = new Date();
    let startDate = new Date();

    switch (range) {
        case "today":
            startDate.setHours(0, 0, 0, 0);
            return { $gte: startDate };
        case "week":
            startDate.setDate(now.getDate() - 7);
            return { $gte: startDate };
        case "quarter":
            startDate.setMonth(now.getMonth() - 3);
            return { $gte: startDate };
        case "year":
            startDate.setFullYear(now.getFullYear() - 1);
            return { $gte: startDate };
        case "all":
        default:
            return null;
    }
};