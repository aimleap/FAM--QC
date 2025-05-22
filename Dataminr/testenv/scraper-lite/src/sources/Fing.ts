import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://app.fing.com/internet/outages';
const apiURL = 'https://app.fing.com/rest/internet/outages/all?top=64';

function padTo2Digits(num: number) {
  return num.toString().padStart(2, '0');
}

function convertMsToTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  let duration = '';
  minutes %= 60;
  if (hours !== 0o0) {
    duration = `Lasting ${padTo2Digits(hours)} hours ${padTo2Digits(minutes)} minutes`;
  } else {
    duration = `Lasting ${padTo2Digits(minutes)} minutes`;
  }
  return duration;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const jsonArray = JSON.parse(response.body).reports;
  jsonArray.forEach((jObj: any) => {
    const { active } = jObj;
    let outageStatus = '';
    if (active) outageStatus = 'Ongoing';
    const providerName = jObj.mainDimensionIspBestName;
    const outageSeverity = jObj.severity;
    const outageStartTime = moment.unix(jObj.startTime / 1000).format('MM/DD/YYYY hh:mm a');
    const outageEndTime = moment.unix(jObj.endTime / 1000).format('MM/DD/YYYY hh:mm a');
    const startTime = new Date(outageStartTime);
    const endTime = new Date(outageEndTime);
    const msBetweenTwoDates = endTime.getTime() - startTime.getTime();
    const outageDuration = convertMsToTime(msBetweenTwoDates);
    const cities: string[] = [];
    const cityArray = jObj.topDrills;
    cityArray.forEach((cityJsonObj: any) => {
      cities.push(cityJsonObj.dimValue);
    });
    const cityLimited = cities.filter((element, index) => index < 3);
    let country = '';
    if (jObj.mainDimensionPath.length > 2) {
      country = `${jObj.mainDimensionPath[1]}, ${jObj.mainDimensionPath[0]}`;
    } else {
      country = jObj?.mainDimensionPath[0];
    }
    const timestamp = moment(outageStartTime, 'MM/DD/YYYY hh:mm a').unix();
    const outageInfo = `${providerName} ; ${outageSeverity} ; ${cities} ; ${country}`;
    const extraDataInfo = {
      'Outage Duration': outageDuration,
      'Outage Start Time': outageStartTime,
      'Outage Status': outageStatus,
      City: cities.toString(),
      City_Limited: cityLimited.toString(),
      Country: country,
    };
    if (active) {
      // This condition used to push only "Ongoing" internet outages.
      posts.push(
        new Post({
          text: outageInfo,
          postUrl: baseURL,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Fing', apiURL, [
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
