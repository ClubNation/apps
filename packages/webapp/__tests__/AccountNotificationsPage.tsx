import React from 'react';
import nock from 'nock';
import { LoggedUser } from '@dailydotdev/shared/src/lib/user';
import loggedUser from '@dailydotdev/shared/__tests__/fixture/loggedUser';
import {
  act,
  fireEvent,
  render,
  RenderResult,
  screen,
  waitFor,
} from '@testing-library/react';
import { AuthContextProvider } from '@dailydotdev/shared/src/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  MockedGraphQLResponse,
  mockGraphQL,
} from '@dailydotdev/shared/__tests__/helpers/graphql';
import { waitForNock } from '@dailydotdev/shared/__tests__/helpers/utilities';
import { BootApp, Visit } from '@dailydotdev/shared/src/lib/boot';
import { NotificationsContextProvider } from '@dailydotdev/shared/src/contexts/NotificationsContext';
import { UpdateProfileParameters } from '@dailydotdev/shared/src/hooks/useProfileForm';
import { UPDATE_USER_PROFILE_MUTATION } from '@dailydotdev/shared/src/graphql/users';
import ProfileNotificationsPage from '../pages/account/notifications';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      isFallback: false,
    };
  },
}));

let client: QueryClient;

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  nock.cleanAll();
  client = new QueryClient();

  globalThis.OneSignal = {
    getRegistrationId: jest.fn().mockResolvedValue('123'),
  };
});

afterEach(() => {
  delete globalThis.OneSignal;
});

const defaultLoggedUser: LoggedUser = {
  ...loggedUser,
  twitter: 'dailydotdev',
  github: 'dailydotdev',
  hashnode: 'dailydotdev',
  portfolio: 'https://daily.dev/?key=vaue',
  acceptedMarketing: false,
  notificationEmail: false,
};
const defaultVisit: Visit = {
  sessionId: 'sample session id',
  visitId: 'sample visit id',
};

const updateUser = jest.fn();
const updateProfileMock = (
  data: UpdateProfileParameters,
): MockedGraphQLResponse => ({
  request: { query: UPDATE_USER_PROFILE_MUTATION, variables: { data } },
  result: { data: { id: '' } },
});

globalThis.Notification = {
  requestPermission: jest.fn(),
  permission: 'default',
} as unknown as jest.Mocked<typeof Notification>;

jest
  .spyOn(window.Notification, 'requestPermission')
  .mockResolvedValueOnce('granted');

const renderComponent = (user = defaultLoggedUser): RenderResult => {
  return render(
    <QueryClientProvider client={client}>
      <AuthContextProvider
        user={user}
        updateUser={updateUser}
        getRedirectUri={jest.fn()}
        visit={defaultVisit}
        tokenRefreshed
      >
        <NotificationsContextProvider app={BootApp.Webapp}>
          <ProfileNotificationsPage />
        </NotificationsContextProvider>
      </AuthContextProvider>
    </QueryClientProvider>,
  );
};

it('should change user push notification', async () => {
  renderComponent();
  const subscription = await screen.findByTestId('push_notification-switch');
  expect(subscription).not.toBeChecked();
  await subscription.click();
  await waitFor(async () => {
    const newSubscription = await screen.findByTestId(
      'push_notification-switch',
    );

    return expect(newSubscription).toBeChecked();
  });
});

it('should change user all email subscription', async () => {
  renderComponent();
  const data: UpdateProfileParameters = {
    acceptedMarketing: true,
    notificationEmail: true,
  };
  mockGraphQL(updateProfileMock(data));
  const subscription = await screen.findByTestId('email_notification-switch');
  expect(subscription).not.toBeChecked();
  fireEvent.click(subscription);
  await waitFor(() =>
    expect(updateUser).toBeCalledWith({ ...defaultLoggedUser, ...data }),
  );
});

it('should change user email marketing subscription', async () => {
  renderComponent();
  const data = { acceptedMarketing: true };
  mockGraphQL(updateProfileMock(data));
  const subscription = await screen.findByTestId('marketing-switch');
  expect(subscription).not.toBeChecked();
  subscription.click();
  await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
  await waitForNock();
  expect(updateUser).toBeCalledWith({ ...defaultLoggedUser, ...data });
});

it('should change user notification email subscription', async () => {
  renderComponent();
  const data = { notificationEmail: true };
  mockGraphQL(updateProfileMock(data));
  const subscription = await screen.findByTestId('new_activity-switch');
  expect(subscription).not.toBeChecked();
  subscription.click();
  await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
  await waitForNock();
  expect(updateUser).toBeCalledWith({ ...defaultLoggedUser, ...data });
});
