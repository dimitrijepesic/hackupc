// File: animal.swift
// Protocol + base class + protocol extension default

import Foundation

protocol Animal {
    func speak() -> String
    func eat()
}

extension Animal {
    func describe() -> String {
        return speak()
    }
}

class Pet {
    let name: String

    public init(name: String) {
        self.name = name
    }

    func greet() -> String {
        return "Hi, I'm \(name)"
    }
}
