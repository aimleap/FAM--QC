import puppeteer, {
  Browser,
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
  LaunchOptions,
  Page,
} from 'puppeteer';
import { promisify } from 'util';
import logger from './logger';
/** *
 *  Each tab generally requires about 100 MB for memory, it needs at least 1.5GB free memory
 *  Singleton Class
 */
// @ts-ignore
let BROWSER: puppeteer.Browser | null = null;

export const sleep = promisify(setTimeout);

export interface PuppeteerProps {
  maxPage?: number;
  maxSleep?: number;
  sleepTime?: number;
  launchOptions?: LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions;
}

const DEFAULT_LAUNCH_OPTIONS: LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions = {
  headless: process.env.NODE_ENV !== 'development',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};

export default class Puppeteer {
  private maxPage: number;

  private sleepTime: number;

  private launchOptions: LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions;

  private maxSleep: number;

  private currentSleep: number;

  constructor({
    maxPage = 10,
    sleepTime = 10000,
    maxSleep = 5,
    launchOptions = DEFAULT_LAUNCH_OPTIONS,
  }: PuppeteerProps) {
    this.maxPage = maxPage;
    this.sleepTime = sleepTime;
    this.launchOptions = launchOptions;
    this.maxSleep = maxSleep;
    this.currentSleep = 0;
  }

  getBrowser = async (): Promise<Browser> => {
    if (BROWSER === null) {
      BROWSER = await puppeteer.launch(this.launchOptions);
    }

    return BROWSER;
  };

  closeBrowser = async () => {
    logger.info('Terminating puppeteer browser');
    const browser = await this.getBrowser();
    await browser.close();
    BROWSER = null;
  };

  getPageCount = async () => {
    const browser = await this.getBrowser();
    const pages = await browser.pages();
    return pages.length;
  };

  getNewPage = async (): Promise<Page> => {
    if ((await this.getPageCount()) >= this.maxPage) {
      if (this.currentSleep >= this.maxSleep) {
        return Promise.reject(new Error('exceed allow max sleep'));
      }

      logger.info(`sleep for ${this.sleepTime / 1000} sec`);
      this.currentSleep += 1;
      await sleep(this.sleepTime);
      return this.getNewPage();
    }

    this.currentSleep = 0;
    logger.info('creating a new page');
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    // Default time out in 2 min
    page.setDefaultTimeout(120000);

    page.on('load', () => {
      logger.info(`Loading a page ${page.url()}`);
    });

    page.on('close', () => {
      logger.info(`closing a page ${page.url()}`);
    });

    return page;
  };
}
