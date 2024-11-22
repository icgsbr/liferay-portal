/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.object.internal.upgrade.v10_0_2.util;

import com.liferay.petra.string.StringBundler;
import com.liferay.portal.dao.orm.common.SQLTransformer;
import com.liferay.portal.kernel.dao.jdbc.AutoBatchPreparedStatementUtil;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.service.UserLocalService;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * @author Igor Costa
 */
public class ObjectUpdateDeletedUserId {

	public static void update(
			Connection connection, String idColumn, String tableName,
			UserLocalService userLocalService)
		throws Exception {

		try (PreparedStatement preparedStatement1 = connection.prepareStatement(
				SQLTransformer.transform(
					StringBundler.concat(
						"select ", idColumn, ", userId, companyId from ",
						tableName)));
			PreparedStatement preparedStatement2 =
				AutoBatchPreparedStatementUtil.concurrentAutoBatch(
					connection,
					StringBundler.concat(
						"update ", tableName, " set userId = ? where ",
						idColumn, " = ?"));
			ResultSet resultSet = preparedStatement1.executeQuery()) {

			while (resultSet.next()) {
				long userId = resultSet.getLong("userId");

				if (userLocalService.fetchUser(userId) != null) {
					continue;
				}

				long companyId = resultSet.getLong("companyId");

				User defaultServiceAccountUser =
					userLocalService.fetchUserByScreenName(
						companyId, "default-service-account");

				preparedStatement2.setLong(
					1, defaultServiceAccountUser.getUserId());

				preparedStatement2.setLong(2, resultSet.getLong(idColumn));

				preparedStatement2.addBatch();
			}

			preparedStatement2.executeBatch();
		}
	}

}