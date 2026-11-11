
import { mockApi } from "./mockApi";
import { realApi } from "./realApi";

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

let selected: typeof realApi = realApi;
if(useMock) {
    selected = mockApi;
}

export const api = selected;