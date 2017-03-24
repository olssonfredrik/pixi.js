'use strict';

const Ticker = PIXI.ticker.Ticker;
const shared = PIXI.ticker.shared;

describe('PIXI.ticker.Ticker', function ()
{
    before(function ()
    {
        this.length = () =>
        {
            let listener = shared._head.next;
            let i = 0;

            while (listener)
            {
                listener = listener.next;
                i++;
            }

            return i;
        };
    });

    it('should be available', function ()
    {
        expect(Ticker).to.be.a.function;
        expect(shared).to.be.an.instanceof(Ticker);
    });

    it('should add and remove listener', function ()
    {
        const listener = sinon.spy();
        const length = this.length();

        shared.add(listener);

        expect(shared._head.next).to.not.be.null;
        expect(shared._head.next.fn).to.equal(listener);
        expect(this.length()).to.equal(length + 1);

        shared.remove(listener);

        expect(this.length()).to.equal(length);
    });

    it('should update a listener', function ()
    {
        const listener = sinon.spy();

        shared.add(listener);
        shared.update();

        expect(listener.calledOnce).to.be.true;

        shared.remove(listener);
        shared.update();

        expect(listener.calledOnce).to.be.true;
    });

    it('should update a listener twice and remove once', function ()
    {
        const listener = sinon.spy();
        const length = this.length();

        shared.add(listener).add(listener);
        shared.update();

        expect(listener.calledTwice).to.be.true;
        expect(this.length()).to.equal(length + 2);

        shared.remove(listener);
        shared.update();

        expect(listener.calledTwice).to.be.true;
        expect(this.length()).to.equal(length);
    });

    it('should respect priority order', function ()
    {
        const length = this.length();
        const listener1 = sinon.spy();
        const listener2 = sinon.spy();
        const listener3 = sinon.spy();
        const listener4 = sinon.spy();

        shared.add(listener1, null, PIXI.UPDATE_PRIORITY.LOW)
            .add(listener4, null, PIXI.UPDATE_PRIORITY.INTERACTION)
            .add(listener3, null, PIXI.UPDATE_PRIORITY.HIGH)
            .add(listener2, null, PIXI.UPDATE_PRIORITY.NORMAL);

        shared.update();

        expect(this.length()).to.equal(length + 4);

        sinon.assert.callOrder(listener4, listener3, listener2, listener1);

        shared.remove(listener1)
            .remove(listener2)
            .remove(listener3)
            .remove(listener4);

        expect(this.length()).to.equal(length);
    });

    it('should auto-remove once listeners', function ()
    {
        const length = this.length();
        const listener = sinon.spy();

        shared.addOnce(listener);

        shared.update();

        expect(listener.calledOnce).to.be.true;
        expect(this.length()).to.equal(length);
    });

    it('should call inserted item with a lower priority', function ()
    {
        const length = this.length();
        const lowListener = sinon.spy();
        const highListener = sinon.spy();
        const mainListener = sinon.spy(() =>
        {
            shared.add(highListener, null, PIXI.UPDATE_PRIORITY.HIGH);
            shared.add(lowListener, null, PIXI.UPDATE_PRIORITY.LOW);
        });

        shared.add(mainListener, null, PIXI.UPDATE_PRIORITY.NORMAL);

        shared.update();

        expect(this.length()).to.equal(length + 3);

        expect(mainListener.calledOnce).to.be.true;
        expect(lowListener.calledOnce).to.be.true;
        expect(highListener.calledOnce).to.be.false;

        shared.remove(mainListener)
            .remove(highListener)
            .remove(lowListener);

        expect(this.length()).to.equal(length);
    });

    it('should remove emit low-priority item during emit', function ()
    {
        const length = this.length();
        const listener2 = sinon.spy();
        const listener1 = sinon.spy(() =>
        {
            shared.add(listener2, null, PIXI.UPDATE_PRIORITY.LOW);
        });

        shared.add(listener1, null, PIXI.UPDATE_PRIORITY.NORMAL);

        shared.update();

        expect(this.length()).to.equal(length + 2);

        expect(listener2.calledOnce).to.be.true;
        expect(listener1.calledOnce).to.be.true;

        shared.remove(listener1)
            .remove(listener2);

        expect(this.length()).to.equal(length);
    });

    it('should remove itself on emit after adding new item', function ()
    {
        const length = this.length();
        const listener2 = sinon.spy();
        const listener1 = sinon.spy(() =>
        {
            shared.add(listener2, null, PIXI.UPDATE_PRIORITY.LOW);
            shared.remove(listener1);

            // listener is removed right away
            expect(this.length()).to.equal(length + 1);
        });

        shared.add(listener1, null, PIXI.UPDATE_PRIORITY.NORMAL);

        shared.update();

        expect(this.length()).to.equal(length + 1);

        expect(listener2.calledOnce).to.be.true;
        expect(listener1.calledOnce).to.be.true;

        shared.remove(listener2);

        expect(this.length()).to.equal(length);
    });

    it('should remove itself before, still calling new item', function ()
    {
        const length = this.length();
        const listener2 = sinon.spy();
        const listener1 = sinon.spy(() =>
        {
            shared.remove(listener1);
            shared.add(listener2, null, PIXI.UPDATE_PRIORITY.LOW);

            // listener is removed right away
            expect(this.length()).to.equal(length + 1);
        });

        shared.add(listener1, null, PIXI.UPDATE_PRIORITY.NORMAL);

        shared.update();

        expect(this.length()).to.equal(length + 1);

        expect(listener2.calledOnce).to.be.true;
        expect(listener1.calledOnce).to.be.true;

        shared.remove(listener2);

        expect(this.length()).to.equal(length);
    });

    it('should remove items before and after current priority', function ()
    {
        const length = this.length();
        const listener2 = sinon.spy();
        const listener3 = sinon.spy();
        const listener4 = sinon.spy();

        shared.add(listener2, null, PIXI.UPDATE_PRIORITY.HIGH);
        shared.add(listener3, null, PIXI.UPDATE_PRIORITY.LOW);
        shared.add(listener4, null, PIXI.UPDATE_PRIORITY.LOW);

        const listener1 = sinon.spy(() =>
        {
            shared.remove(listener2)
                .remove(listener3);

            // listener is removed right away
            expect(this.length()).to.equal(length + 2);
        });

        shared.add(listener1, null, PIXI.UPDATE_PRIORITY.NORMAL);

        shared.update();

        expect(this.length()).to.equal(length + 2);

        expect(listener2.calledOnce).to.be.true;
        expect(listener3.calledOnce).to.be.false;
        expect(listener4.calledOnce).to.be.true;
        expect(listener1.calledOnce).to.be.true;

        shared.update();

        expect(listener2.calledOnce).to.be.true;
        expect(listener3.calledOnce).to.be.false;
        expect(listener4.calledTwice).to.be.true;
        expect(listener1.calledTwice).to.be.true;

        shared.remove(listener1)
            .remove(listener4);

        expect(this.length()).to.equal(length);
    });
});
