// File: vet.swift
// Method name collision: describe() also exists on Animal protocol extension

import Foundation

class Vet {
    func describe() -> String {
        return "I am the vet"
    }

    func emergency(_ animal: Animal) {
        animal.speak()
        treat()
    }

    func routine(_ animal: Animal) {
        animal.eat()
    }

    private func treat() {
        Logger.log("Treating animal")
    }
}
