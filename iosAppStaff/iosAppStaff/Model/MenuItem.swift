//
//  MenuItem.swift
//  iosAppStaff
//
//  Created by 108 on 28.05.26.
//

import Foundation

struct MenuItem: Codable, Identifiable {
    var id: String?
    var category: String
    var name: String
    var description: String?
    var price: Double
    var imgUrl: String?
    var isActive: Bool?
    var sortOrder: Int?
    var createdAt: String?
    var updatedAt: String?
}
