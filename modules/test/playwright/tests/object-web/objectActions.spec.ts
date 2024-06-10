/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, mergeTests} from '@playwright/test';
import path from 'node:path';

import {apiHelpersTest} from '../../fixtures/apiHelpersTest';
import {editObjectDefinitionPagesTest} from '../../fixtures/editObjectDefinitionPagesTest';
import {loginTest} from '../../fixtures/loginTest';
import {objectPagesTest} from '../../fixtures/objectPagesTest';
import {getRandomInt} from '../../utils/getRandomInt';
import {waitForSuccessAlert} from '../../utils/waitForSuccessAlert';
import { mock } from 'node:test';
import { mockedObjectFields } from './dependencies/objectMockedFields';

export const test = mergeTests(
	apiHelpersTest,
	editObjectDefinitionPagesTest,
	loginTest(),
	objectPagesTest
);

interface CreatedEntities {
	notificationQueueEntryIds: number[];
	notificationTemplateIds: number[];
	objectDefinitonIds: number[];
}

let createdEntities: Partial<CreatedEntities> = {};

test.afterEach(async ({apiHelpers}) => {
	if (createdEntities.objectDefinitonIds?.length) {
		for (
			let index = 0;
			index < createdEntities.objectDefinitonIds.length;
			index++
		) {
			await apiHelpers.objectAdmin.deleteObjectDefinition(
				createdEntities.objectDefinitonIds[index]
			);
		}
	}

	if (createdEntities.notificationQueueEntryIds?.length) {
		for (
			let index = 0;
			index < createdEntities.notificationQueueEntryIds.length;
			index++
		) {
			await apiHelpers.notification.deleteNotificationQueueEntry(
				createdEntities.notificationQueueEntryIds[index]
			);
		}
	}

	if (createdEntities.notificationTemplateIds?.length) {
		for (
			let index = 0;
			index < createdEntities.notificationTemplateIds.length;
			index++
		) {
			await apiHelpers.notification.deleteNotificationTemplate(
				createdEntities.notificationTemplateIds[index]
			);
		}
	}

	createdEntities = {};
});

test.describe('manage object actions through object actions tab', () => {
	test('notification action section must display all persisted notifications', async ({
		actionBuilderPage,
		apiHelpers,
		editObjectDefinitionPage,
		page,
		sidePanelObjectActionPage,
		viewObjectActionsPage,
		viewObjectDefinitionsPage,
	}) => {
		const notificationTemplateIds: number[] = [];
		const names: string[] = [];

		for (let index = 1; index <= 21; index++) {
			const notificationTemplate =
				await apiHelpers.notification.postRandomNotificationTemplate(
					'notification template test ' + getRandomInt()
				);
			notificationTemplateIds.push(notificationTemplate.id);
			names.push(
				notificationTemplate.name + ' ' + notificationTemplate.type
			);
		}

		createdEntities.notificationTemplateIds = notificationTemplateIds;

		const objectDefinition =
			await apiHelpers.objectAdmin.postRandomObjectDefinition({
				objectFolderExternalReferenceCode: 'default',
				status: {code: 0},
			});

		createdEntities.objectDefinitonIds = [objectDefinition.id];

		await viewObjectDefinitionsPage.goto();

		await viewObjectDefinitionsPage.clickEditObjectDefinitionLink(
			objectDefinition.name
		);

		await editObjectDefinitionPage.openActionsTab();

		await viewObjectActionsPage.openObjectActionSidePanel();

		await sidePanelObjectActionPage.openActionBuilderTab();

		await actionBuilderPage.chooseNotificationOption();

		await actionBuilderPage.clickInputNotificationsCombo();

		for (let index = 0; index < names.length; index++) {
			await expect(
				page
					.frameLocator('iframe')
					.getByRole('option', {name: names[index]})
			).toBeVisible();
		}
	});
});

test('can send notification email via download action', async ({
	apiHelpers,
	page,
	viewObjectEntriesPage,
}) => {

	// Create email notification template

	const senderEmail: string = 'test' + getRandomInt() + '@liferay.com';

	const notificationTemplate =
		await apiHelpers.notification.postRandomNotificationTemplate(
			'notification template test ' + getRandomInt(),
			senderEmail
		);

	createdEntities.notificationTemplateIds = [notificationTemplate.id];

	// Create object definition with an attachment field

	const objectDefinition = await apiHelpers.objectAdmin.postRandomObjectDefinition({
		objectFields: [mockedObjectFields.attchmentFieldDocumentAndMedia],
		objectFolderExternalReferenceCode: 'default',
		status: {code: 0},
	});

	createdEntities.objectDefinitonIds = [objectDefinition.id];

	// Create an action to send notification after attachment download

	await apiHelpers.objectAdmin.postObjectActionByExternalReferenceCode(
		objectDefinition.externalReferenceCode,
		{
			active: true,
			label: {
				en_US: 'downloadAttachmentArchive',
			},
			name: 'downloadAttachmentArchive',
			objectActionExecutorKey: 'notification',
			objectActionTriggerKey: 'onAfterAttachmentDownload',
			parameters: {
				notificationTemplateId: notificationTemplate.id,
				type: 'email',
			},
		}
	);

	// Create an object entry

	await viewObjectEntriesPage.goto(objectDefinition.id);

	await viewObjectEntriesPage.clickAddObjectEntry();

	const fileChooserPromise = page.waitForEvent('filechooser');

	await viewObjectEntriesPage.selectFileButton.click();

	const fileChooser = await fileChooserPromise;

	await fileChooser.setFiles(
		path.join(__dirname, 'dependencies', 'sampleFile.txt')
	);

	await viewObjectEntriesPage.page
		.getByText('sampleFile.txt')
		.waitFor({state: 'visible'});

	await viewObjectEntriesPage.saveObjectEntryButton.click();

	await waitForSuccessAlert(page);

	// Download attachment from object entry

	await viewObjectEntriesPage.goto(objectDefinition.id);

	await page
		.getByRole('button', {name: 'Search'})
		.waitFor({state: 'visible'});

	await viewObjectEntriesPage.page.getByText('sampleFile.txt').click();

	// Verify if the email was sent

	const notificationQueueEntries =
		await apiHelpers.notification.getNotificationQueueEntriesPage(
			senderEmail
		);

	createdEntities.notificationQueueEntryIds =
		notificationQueueEntries.items.map((item: any) => item.id);

	expect(notificationQueueEntries.items.length).toBeTruthy();
});
