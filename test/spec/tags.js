/**
 * Created by TIMYY on 2014/7/20.
 */
describe('exports',function(){
// 测试开始
    describe('.parse()',function(){
        it('should parse long formed tags 应该处理长格式tags',function(){
            var args = ['--depth=4','--hello=world'];
            var results = exports.parse(args);

            expect(results).to.have.a.property('depth',4);  //参数 depth
            expect(results).to.have.a.property('hello','world'); //参数 hello 为什么处理为两个单词。
        });
        it('应该返回默认值',function() {
            var args = ["--depth=4", "--hello=world"];
            var defaults = { depth: 2, foo: "bar" };
            var results = exports.parse(args, defaults);

            var expected = {
                depth: 4,
                foo: "bar",
                hello: "world"
            };

            expect(results).to.deep.equal(expected);
        });
        it("should accept tags without values as a bool", function(){
            var args = ["--searchContents"];
            var results = exports.parse(args);

            expect(results).to.have.a.property("searchContents", true);
        });
    });

});