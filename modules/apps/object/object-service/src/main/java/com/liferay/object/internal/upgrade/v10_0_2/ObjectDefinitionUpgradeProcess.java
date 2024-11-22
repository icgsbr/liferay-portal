/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.object.internal.upgrade.v10_0_2;

import com.liferay.object.internal.upgrade.v10_0_2.util.ObjectUpdateDeletedUserId;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.upgrade.UpgradeProcess;

/**
 * @author Igor Costa
 */
public class ObjectDefinitionUpgradeProcess extends UpgradeProcess {

	public ObjectDefinitionUpgradeProcess(UserLocalService userLocalService) {
		_userLocalService = userLocalService;
	}

	@Override
	protected void doUpgrade() throws Exception {
		ObjectUpdateDeletedUserId.update(
			connection, "objectDefinitionId", "ObjectDefinition",
			_userLocalService);
	}

	private final UserLocalService _userLocalService;

}