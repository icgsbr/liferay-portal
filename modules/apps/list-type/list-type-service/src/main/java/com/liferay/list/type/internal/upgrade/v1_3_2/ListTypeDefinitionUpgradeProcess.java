/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.list.type.internal.upgrade.v1_3_2;

import com.liferay.list.type.internal.upgrade.v1_3_2.util.ListTypeUpdateDeletedUserId;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.upgrade.UpgradeProcess;

/**
 * @author Igor Costa
 */
public class ListTypeDefinitionUpgradeProcess extends UpgradeProcess {

	public ListTypeDefinitionUpgradeProcess(UserLocalService userLocalService) {
		_userLocalService = userLocalService;
	}

	@Override
	protected void doUpgrade() throws Exception {
		ListTypeUpdateDeletedUserId.update(
			connection, "listTypeDefinitionId", "ListTypeDefinition",
			_userLocalService);
	}

	private final UserLocalService _userLocalService;

}