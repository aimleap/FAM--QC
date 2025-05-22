import { Browser, Page, PuppeteerLaunchOptions } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
// eslint-disable-next-line import/no-extraneous-dependencies
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Puppeteer, { PuppeteerProps, sleep } from './puppeteer';
import logger from './logger';

// @ts-ignore
let BROWSER: puppeteer.Browser | null = null;

const DEFAULT_STEALTH_LAUNCH_OPTIONS: PuppeteerLaunchOptions = {
  headless: process.env.NODE_ENV !== 'development',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};

export default class PuppeteerStealth extends Puppeteer {
  private stealthLaunchOptions: PuppeteerLaunchOptions;

  private props: PuppeteerProps;

  private nowSleep: number;

  constructor(
    stealthLaunchOptions: PuppeteerLaunchOptions = DEFAULT_STEALTH_LAUNCH_OPTIONS,
    props: PuppeteerProps = {
      maxPage: 10,
      sleepTime: 10000,
      maxSleep: 5,
    },
  ) {
    super(props);
    this.stealthLaunchOptions = stealthLaunchOptions;
    this.props = props;
    this.nowSleep = 0;
  }

  /* Override */
  getBrowser = async (): Promise<Browser> => {
    if (BROWSER == null) {
      BROWSER = await puppeteer.use(StealthPlugin()).launch(this.stealthLaunchOptions);
    }
    return BROWSER;
  };

  /* Override */
  getNewPage = async (extraHeaders: any = {}): Promise<Page> => {
    if ((await this.getPageCount()) >= this.props.maxPage!) {
      if (this.nowSleep >= this.props.maxSleep!) {
        return Promise.reject(new Error('exceed allow max sleep'));
      }

      logger.info(`sleep for ${this.props.sleepTime! / 1000} sec`);
      this.nowSleep += 1;
      await sleep(this.props.sleepTime!);
      return this.getNewPage();
    }

    this.nowSleep = 0;
    logger.info('creating a new stealth page');
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    page.setDefaultTimeout(120000);
    await page.setExtraHTTPHeaders(extraHeaders);

    page.on('load', () => {
      logger.info(`Loading a stealth page ${page.url()}`);
    });

    page.on('close', () => {
      logger.info(`closing a stealth page ${page.url()}`);
    });

    return page;
  };
}
