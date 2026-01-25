export class DateTimeHelper {

    private constructor() {}

    static MARKET_HOLIDAYS: string[];

    static timeoutHandle: NodeJS.Timeout;

    static getCurrentEasternDateString(): string {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const parts = formatter.formatToParts(new Date());

        const year = parts.find(p => p.type === 'year')!.value;
        const month = parts.find(p => p.type === 'month')!.value;
        const day = parts.find(p => p.type === 'day')!.value;

        return `${year}-${month}-${day}`; // YYYY-MM-dd
    }

    static async initializeMarketHolidays(): Promise<void> {
        const runCalculateHolidays = async () => {
            this.calculateMarketHolidays();
        };

        runCalculateHolidays();
        const interval = 1000 * 60 * 60 * 24; // 24 hours
        this.timeoutHandle = setTimeout(runCalculateHolidays, interval);
    }

    static isMarketTrading(): boolean {
        return this.isWithinTradingWindow() && !this.isMarketHoliday();
    }

    static killMarketHolidaysJob(): void {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
        }
    }

    private static calculateMarketHolidays(): void {
        this.MARKET_HOLIDAYS = [
            '01-01', // New Year's Day
            '12-25', // Christmas
        ];

        const easterSunday = this.calculateEasterSunday();
        const year = easterSunday.getFullYear();
        const month = easterSunday.getMonth();
        
        // Good Friday is 2 days before Easter
        // Only including Good Friday. While the US markets are closed on Easter,
        // it looks like the rest of the world is still trading, according to what is seen on Kitco.
        const goodFridayDate = new Date(year, month, easterSunday.getDate() - 2);
        
        this.MARKET_HOLIDAYS.push(`${String(goodFridayDate.getMonth() + 1).padStart(2, '0')}-${String(goodFridayDate.getDate()).padStart(2, '0')}`);
    }

    private static calculateEasterSunday(): Date {
        // Easter Sunday and Good Friday - calculated using Computus algorithm
        const year = new Date().getFullYear();
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    }

    private static isWithinTradingWindow(): boolean {
        const now = new Date();
        const easternTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
        const hour = easternTime.getHours();

        // Sunday (0) at 18:00 or later, OR Monday-Thursday (1-4) any time, OR Friday (5) before 17:00
        return (dayOfWeek === 0 && hour >= 18) || 
               (dayOfWeek >= 1 && dayOfWeek <= 4) || 
               (dayOfWeek === 5 && hour < 17);
    }

    private static isMarketHoliday(): boolean {
        const currentDate = this.getCurrentEasternDateString();
        const monthDay = currentDate.slice(5); // MM-DD
        return this.MARKET_HOLIDAYS.includes(monthDay);
    }
}