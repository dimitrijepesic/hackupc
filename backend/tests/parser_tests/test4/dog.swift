// File: dog.swift
// Inherits Pet, conforms Animal, uses override + super + implicit self

import Foundation

class Dog: Pet, Animal {
    func speak() -> String {
        return "Av av!"
    }

    func eat() {
        Logger.log("Dog eats")
    }

    override func greet() -> String {
        let base = super.greet()
        return "\(base), woof!"
    }

    func fetch() {
        speak()
        Logger.log("Dog fetches ball")
    }
}
