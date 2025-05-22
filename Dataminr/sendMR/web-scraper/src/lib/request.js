import torRequest from 'tor-request';
import { proxy } from 'config';
import { promisify } from 'util';

const {
  host, control_port: controlPort, password, sock_port: sockPort,
} = proxy;

torRequest.TorControlPort.host = host;
torRequest.TorControlPort.port = controlPort;
torRequest.TorControlPort.password = password;
torRequest.setTorAddress(host, sockPort);

const { newTorSession } = torRequest;
const request = ({ url, ...opt }) => promisify(torRequest.request).call(torRequest, url, { ...opt });

export { request, newTorSession };
