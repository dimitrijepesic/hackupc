// File: utils.swift

import Foundation

class Logger {
    static func log(_ message: String) {
        print("[LOG] \(message)")
    }

    static func warn(_ message: String) {
        print("[WARN] \(message)")
    }
}
