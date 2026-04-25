import Foundation

class Animal {
    func speak() -> String {
        return "..."
    }

    func eat(_ food: String) {
        // base eat
    }
}

// MARK: - Dog
class Dog: Animal {

    override func speak() -> String {
        return "Woof!"
    }

    func fetch() -> String {
        self.run()
        return self.speak()
    }

    func run() {
        // mutual recursion
        let _ = self.fetch()
    }
}

// MARK: - Cat
class Cat: Animal {

    override func speak() -> String {
        return self.purr()
    }

    func purr() -> String {
        return "Purr..."
    }
}

// MARK: - GuideDog
class GuideDog: Dog {

    func guide() {
        let _ = self.speak()
        self.eat("premium")
        super.run()
    }

    override func eat(_ food: String) {
        // special diet
        super.eat(food)
    }
}
