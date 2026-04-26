// File: cat.swift
// Inherits Pet, conforms Animal, has static method

import Foundation

class Cat: Pet, Animal {
    func speak() -> String {
        return "Mjau!"
    }

    func eat() {
        Logger.log("Cat eats")
    }

    override func greet() -> String {
        let base = super.greet()
        return "\(base), meow!"
    }

    static func areLiquid() -> Bool {
        return true
    }
}
