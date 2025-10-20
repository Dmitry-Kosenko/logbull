import { getApplicationServer } from '../../../constants';
import RequestOptions from '../../../shared/api/RequestOptions';
import { apiHelper } from '../../../shared/api/apiHelper';
import type { CreatePlanRequest } from '../model/CreatePlanRequest';
import type { UpdatePlanRequest } from '../model/UpdatePlanRequest';
import type { UserPlan } from '../model/UserPlan';

export const userPlanApi = {
  async getPlans(): Promise<UserPlan[]> {
    const requestOptions: RequestOptions = new RequestOptions();
    return apiHelper.fetchGetJson(`${getApplicationServer()}/api/v1/plans`, requestOptions);
  },

  async createPlan(request: CreatePlanRequest): Promise<UserPlan> {
    const requestOptions: RequestOptions = new RequestOptions();
    requestOptions.setBody(JSON.stringify(request));
    return apiHelper.fetchPostJson(`${getApplicationServer()}/api/v1/plans`, requestOptions);
  },

  async updatePlan(planId: string, request: UpdatePlanRequest): Promise<UserPlan> {
    const requestOptions: RequestOptions = new RequestOptions();
    requestOptions.setBody(JSON.stringify(request));
    return apiHelper.fetchPutJson(
      `${getApplicationServer()}/api/v1/plans/${planId}`,
      requestOptions,
    );
  },

  async deletePlan(planId: string): Promise<{ message: string }> {
    const requestOptions: RequestOptions = new RequestOptions();
    return apiHelper.fetchDeleteJson(
      `${getApplicationServer()}/api/v1/plans/${planId}`,
      requestOptions,
    );
  },
};
