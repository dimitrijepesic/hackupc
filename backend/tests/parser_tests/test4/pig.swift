// File: pig.swift
// Conforms Animal directly (no Pet), has private method + extension

import Foundation

class Pig: Animal {
    var weight: Double

    init(weight: Double) {
        self.weight = weight
    }

    func speak() -> String {
        return "Gic!"
    }

    func eat() {
        grow()
        Logger.log("Pig eats")
    }

    private func grow() {
        weight += 0.5
    }
}

extension Pig {
    func roll() {
        speak()
        Logger.log("Pig rolls in mud")
    }
}
